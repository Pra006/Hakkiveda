import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/blogs/:id
 */
export async function GET(request, { params }) {
  try {
    await requireAdmin("blogs");
    const { id } = await params;

    const blog = await prisma.blogPost.findUnique({ where: { id } });
    if (!blog) return errorResponse("Blog post not found", 404);

    return jsonResponse(blog);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}

/**
 * PATCH /api/admin/blogs/:id
 * Update a blog post — full update or status-only toggle.
 */
export async function PATCH(request, { params }) {
  try {
    const { admin } = await requireAdmin("blogs");
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return errorResponse("Blog post not found", 404);

    // Status-only toggle (publish/unpublish)
    if (body.status !== undefined && Object.keys(body).length <= 2) {
      const newStatus = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
      const data = { status: newStatus };

      // Auto-set publishedAt when publishing for the first time
      if (newStatus === "PUBLISHED" && !existing.publishedAt) {
        data.publishedAt = new Date();
      }

      const updated = await prisma.blogPost.update({ where: { id }, data });

      await createAuditLog({
        adminId: admin.id,
        action: newStatus === "PUBLISHED" ? "ACTIVATE" : "SUSPEND",
        entityType: "BlogPost",
        entityId: id,
        description: `${newStatus === "PUBLISHED" ? "Published" : "Unpublished"} blog post "${existing.title}"`,
      });

      return jsonResponse(updated);
    }

    // Full update
    const { title, excerpt, content, featuredImage, category, author, tags, status, publishedAt } = body;
    let { slug } = body;

    if (title !== undefined && !title?.trim()) return errorResponse("Title is required", 400);

    if (slug !== undefined) {
      slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)/g, "");
      if (!slug) return errorResponse("A valid slug is required", 400);

      const slugConflict = await prisma.blogPost.findFirst({ where: { slug, NOT: { id } } });
      if (slugConflict) return errorResponse("A blog post with this slug already exists", 409);
    }

    const postStatus = status === "PUBLISHED" ? "PUBLISHED" : (status === "DRAFT" ? "DRAFT" : undefined);

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (slug !== undefined) data.slug = slug;
    if (excerpt !== undefined) data.excerpt = excerpt?.trim() || null;
    if (content !== undefined) data.content = content || null;
    if (featuredImage !== undefined) data.featuredImage = featuredImage || null;
    if (category !== undefined) data.category = category?.trim() || null;
    if (author !== undefined) data.author = author?.trim() || null;
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags.filter(Boolean) : [];
    if (postStatus !== undefined) data.status = postStatus;
    if (publishedAt !== undefined) data.publishedAt = publishedAt ? new Date(publishedAt) : null;

    // Auto-set publishedAt when publishing for first time
    if (data.status === "PUBLISHED" && !existing.publishedAt && !data.publishedAt) {
      data.publishedAt = new Date();
    }

    const updated = await prisma.blogPost.update({ where: { id }, data });

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "BlogPost",
      entityId: id,
      description: `Updated blog post "${updated.title}"`,
    });

    return jsonResponse(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    if (err.code === "P2002") return errorResponse("A blog post with this slug already exists", 409);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * DELETE /api/admin/blogs/:id
 */
export async function DELETE(request, { params }) {
  try {
    const { admin } = await requireAdmin("blogs");
    const { id } = await params;

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return errorResponse("Blog post not found", 404);

    await prisma.blogPost.delete({ where: { id } });

    await createAuditLog({
      adminId: admin.id,
      action: "DELETE",
      entityType: "BlogPost",
      entityId: id,
      description: `Deleted blog post "${existing.title}"`,
    });

    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}
