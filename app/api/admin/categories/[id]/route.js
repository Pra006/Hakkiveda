import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/categories/:id
 */
export async function GET(request, { params }) {
  try {
    await requireAdmin("categories");
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          select: { id: true, name: true, slug: true, isActive: true, _count: { select: { products: true } } },
          orderBy: { name: "asc" },
        },
        _count: { select: { products: true } },
      },
    });

    if (!category) return errorResponse("Category not found", 404);
    return jsonResponse(category);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}

/**
 * PATCH /api/admin/categories/:id
 * Update category fields. Supports partial updates.
 */
export async function PATCH(request, { params }) {
  try {
    const { admin } = await requireAdmin("categories");
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { children: { select: { id: true } } },
    });
    if (!existing) return errorResponse("Category not found", 404);

    // Handle status-only toggle
    if (body.isActive !== undefined && Object.keys(body).length === 1) {
      const updated = await prisma.category.update({
        where: { id },
        data: { isActive: body.isActive },
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: { select: { children: true, products: true } },
        },
      });

      await createAuditLog({
        adminId: admin.id,
        action: body.isActive ? "ACTIVATE" : "SUSPEND",
        entityType: "Category",
        entityId: id,
        description: `${body.isActive ? "Activated" : "Deactivated"} category "${updated.name}"`,
      });

      return jsonResponse(updated);
    }

    const data = {};

    if (body.name !== undefined) {
      if (!body.name?.trim()) return errorResponse("Category name cannot be empty", 400);
      data.name = body.name.trim();
    }

    if (body.slug !== undefined) {
      let slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)/g, "");
      if (!slug) return errorResponse("A valid slug is required", 400);
      // Check duplicate slug (exclude current)
      const dup = await prisma.category.findFirst({ where: { slug, id: { not: id } } });
      if (dup) return errorResponse("A category with this slug already exists", 409);
      data.slug = slug;
    }

    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.image !== undefined) data.image = body.image || null;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.sortOrder !== undefined) data.sortOrder = parseInt(body.sortOrder, 10) || 0;

    if (body.parentId !== undefined) {
      const newParentId = body.parentId || null;

      if (newParentId === id) return errorResponse("A category cannot be its own parent", 400);

      if (newParentId) {
        const parent = await prisma.category.findUnique({ where: { id: newParentId } });
        if (!parent) return errorResponse("Parent category not found", 404);

        // Prevent setting a parent that is a child of this category (circular)
        if (parent.parentId === id) {
          return errorResponse("Cannot set a subcategory as the parent (circular relationship)", 400);
        }

        // Only allow one level of nesting
        if (parent.parentId) {
          return errorResponse("Subcategories cannot have their own subcategories (max 2 levels)", 400);
        }

        // If this category has children, it cannot become a subcategory
        if (existing.children.length > 0) {
          return errorResponse("A category with subcategories cannot become a subcategory itself", 400);
        }
      }

      data.parentId = newParentId;
    }

    if (Object.keys(data).length === 0) return errorResponse("No valid fields to update", 400);

    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          select: { id: true, name: true, slug: true, isActive: true, _count: { select: { products: true } } },
          orderBy: { name: "asc" },
        },
        _count: { select: { products: true } },
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "Category",
      entityId: id,
      description: `Updated category "${category.name}"`,
      metadata: { fields: Object.keys(data) },
    });

    return jsonResponse(category);
  } catch (err) {
    if (err instanceof Response) return err;
    if (err.code === "P2002") return errorResponse("A category with this slug already exists", 409);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * DELETE /api/admin/categories/:id
 * Safe delete: refuses if products or subcategories are associated.
 * Supports ?force=reassign&target=<categoryId> to reassign products first.
 */
export async function DELETE(request, { params }) {
  try {
    const { admin } = await requireAdmin("categories");
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force");
    const targetId = searchParams.get("target");

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!category) return errorResponse("Category not found", 404);

    // Check subcategories
    if (category._count.children > 0) {
      return errorResponse(
        `Cannot delete "${category.name}" because it has ${category._count.children} subcategorie(s). Delete or reassign them first.`,
        400
      );
    }

    // Check products
    if (category._count.products > 0) {
      if (force === "reassign" && targetId) {
        // Validate target category exists and is different
        if (targetId === id) return errorResponse("Cannot reassign products to the same category", 400);
        const target = await prisma.category.findUnique({ where: { id: targetId } });
        if (!target) return errorResponse("Target category not found", 404);

        // Reassign products then delete
        await prisma.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: targetId },
        });

        await prisma.category.delete({ where: { id } });

        await createAuditLog({
          adminId: admin.id,
          action: "DELETE",
          entityType: "Category",
          entityId: id,
          description: `Deleted category "${category.name}" and reassigned ${category._count.products} product(s) to "${target.name}"`,
        });

        return jsonResponse({
          message: `Category deleted. ${category._count.products} product(s) reassigned to "${target.name}".`,
        });
      }

      return errorResponse(
        `Cannot delete "${category.name}" because it has ${category._count.products} product(s) assigned. ` +
        `You can deactivate it instead, or use ?force=reassign&target=<categoryId> to move products to another category before deleting.`,
        400
      );
    }

    // Safe to delete
    await prisma.category.delete({ where: { id } });

    await createAuditLog({
      adminId: admin.id,
      action: "DELETE",
      entityType: "Category",
      entityId: id,
      description: `Deleted category "${category.name}"`,
    });

    return jsonResponse({ message: "Category deleted successfully" });
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}
