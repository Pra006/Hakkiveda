import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parsePagination,
  paginatedResponse,
  createAuditLog,
} from "@/lib/admin";
import prisma from "@/lib/prisma";
import { validateProduct, PRODUCT_SORT_FIELDS } from "@/lib/products";

/**
 * GET /api/admin/products — list with search, filter, sort and pagination
 */
export async function GET(request) {
  try {
    await requireAdmin("products");
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const stockFilter = searchParams.get("stock") || "";
    const sort = PRODUCT_SORT_FIELDS.includes(searchParams.get("sort"))
      ? searchParams.get("sort")
      : "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;
    else if (status === "b2b") where.isB2B = true;
    else if (status === "featured") where.isFeatured = true;
    else if (status === "not-featured") where.isFeatured = false;
    else if (status === "new-arrival") where.isNewArrival = true;

    if (categoryId) where.categoryId = categoryId;

    if (stockFilter === "out") where.stock = { lte: 0 };
    else if (stockFilter === "low") where.stock = { gt: 0, lte: 10 };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { variants: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return paginatedResponse(products, total, page, limit);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_PRODUCTS_LIST_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/admin/products — create a product
 */
export async function POST(request) {
  try {
    const { admin } = await requireAdmin("products");
    const body = await request.json();

    const { errors, data } = validateProduct(body);
    if (errors.length) return errorResponse(errors.join(". "), 400);

    const slugTaken = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (slugTaken) return errorResponse("A product with this URL slug already exists", 409);

    if (data.sku) {
      const skuTaken = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (skuTaken) return errorResponse("A product with this SKU already exists", 409);
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) return errorResponse("Selected category does not exist", 400);
    }

    const product = await prisma.product.create({
      data: {
        images: [],
        stock: 0,
        isActive: true,
        ...data,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "CREATE",
      entityType: "Product",
      entityId: product.id,
      description: `Created product ${product.name}`,
      metadata: { slug: product.slug, retailPrice: product.retailPrice },
    });

    return jsonResponse(product, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_PRODUCT_CREATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
