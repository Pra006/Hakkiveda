import { requireAdmin, jsonResponse, errorResponse, parsePagination, paginatedResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    await requireAdmin("b2b.payments");

    const { searchParams } = new URL(request.url);
    const { skip, take, page, pageSize } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";

    const where = {};

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { invoice: { invoiceNumber: { contains: search, mode: "insensitive" } } },
        { organization: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.b2BPayment.findMany({
        where,
        skip,
        take,
        orderBy: { paidAt: "desc" },
        include: {
          invoice: { select: { id: true, invoiceNumber: true } },
          organization: { select: { id: true, companyName: true } },
        },
      }),
      prisma.b2BPayment.count({ where }),
    ]);

    return paginatedResponse(payments, total, page, pageSize);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("Failed to fetch B2B payments:", err);
    return errorResponse("Failed to fetch payments", 500);
  }
}
