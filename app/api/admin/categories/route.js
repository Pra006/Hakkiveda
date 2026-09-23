import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/categories
 * Lists all categories with parent info, child count, product count.
 * Supports ?flat=true for a flat list (default) or tree shape.
 */
export async function GET(request) {
  try {
    await requireAdmin("categories");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where = search
      ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }] }
      : {};

    const categories = await prisma.category.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { children: true, products: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return jsonResponse(categories);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/admin/categories
 * Create a new category with validation.
 */
export async function POST(request) {
  try {
    const { admin } = await requireAdmin("categories");
    const body = await request.json();
    const { name, description, image, parentId, isActive } = body;
    let { slug } = body;

    // Validation
    if (!name?.trim()) return errorResponse("Category name is required", 400);
    if (!slug?.trim()) {
      slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    // Sanitize slug
    slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug) return errorResponse("A valid slug is required", 400);

    // Check duplicate slug
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return errorResponse("A category with this slug already exists", 409);

    // Validate parent
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) return errorResponse("Parent category not found", 404);
      // Only allow one level of nesting (parent must be a root category)
      if (parent.parentId) {
        return errorResponse("Subcategories cannot have their own subcategories (max 2 levels)", 400);
      }
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        image: image || null,
        parentId: parentId || null,
        isActive: isActive ?? true,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { children: true, products: true } },
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "CREATE",
      entityType: "Category",
      entityId: category.id,
      description: `Created category "${category.name}"`,
    });

    return jsonResponse(category, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    if (err.code === "P2002") return errorResponse("A category with this slug already exists", 409);
    return errorResponse("Internal server error", 500);
  }
}
