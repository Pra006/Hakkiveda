import { requireAdmin, jsonResponse, errorResponse, parsePagination, paginatedResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    await requireAdmin("b2b.invoices");

    const { searchParams } = new URL(request.url);
    const { skip, take, page, pageSize } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";

    const where = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { organization: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const [invoices, total] = await Promise.all([
      prisma.b2BInvoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          organization: { select: { id: true, companyName: true } },
          _count: { select: { items: true, payments: true } },
        },
      }),
      prisma.b2BInvoice.count({ where }),
    ]);

    return paginatedResponse(invoices, total, page, pageSize);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("Failed to fetch B2B invoices:", err);
    return errorResponse("Failed to fetch invoices", 500);
  }
}
