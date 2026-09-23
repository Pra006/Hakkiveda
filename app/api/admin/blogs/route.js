import { requireAdmin, jsonResponse, errorResponse, createAuditLog, parsePagination, paginatedResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/blogs
 * List blog posts with search, filter by status/category, and pagination.
 */
export async function GET(request) {
  try {
    await requireAdmin("blogs");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const { page, limit, skip } = parsePagination(searchParams);

    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && (status === "DRAFT" || status === "PUBLISHED")) {
      where.status = status;
    }

    if (category) {
      where.category = { equals: category, mode: "insensitive" };
    }

    const [blogs, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return paginatedResponse(blogs, total, page, limit);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/admin/blogs
 * Create a new blog post.
 */
export async function POST(request) {
  try {
    const { admin } = await requireAdmin("blogs");
    const body = await request.json();
    const { title, excerpt, content, featuredImage, category, author, tags, status, publishedAt } = body;
    let { slug } = body;

    if (!title?.trim()) return errorResponse("Title is required", 400);

    if (!slug?.trim()) {
      slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug) return errorResponse("A valid slug is required", 400);

    // Check duplicate slug
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) return errorResponse("A blog post with this slug already exists", 409);

    const postStatus = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

    const blog = await prisma.blogPost.create({
      data: {
        title: title.trim(),
        slug,
        excerpt: excerpt?.trim() || null,
        content: content || null,
        featuredImage: featuredImage || null,
        category: category?.trim() || null,
        author: author?.trim() || null,
        tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
        status: postStatus,
        publishedAt: postStatus === "PUBLISHED" ? (publishedAt ? new Date(publishedAt) : new Date()) : (publishedAt ? new Date(publishedAt) : null),
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "CREATE",
      entityType: "BlogPost",
      entityId: blog.id,
      description: `Created blog post "${blog.title}" (${postStatus})`,
    });

    return jsonResponse(blog, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    if (err.code === "P2002") return errorResponse("A blog post with this slug already exists", 409);
    return errorResponse("Internal server error", 500);
  }
}
