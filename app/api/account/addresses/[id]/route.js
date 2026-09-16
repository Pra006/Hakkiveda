import prisma from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/b2b";
import { requireCustomer } from "@/lib/cart";

export async function PUT(request, { params }) {
  try {
    const customer = await requireCustomer();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.customerAddress.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) return errorResponse("Address not found", 404);

    const { label, type, fullName, phone, province, district, city, streetAddress, landmark, postalCode, isDefault } = body;

    if (!fullName || !phone || !province || !city) {
      return errorResponse("Full name, phone, province, and city are required", 400);
    }

    const validTypes = ["HOME", "OFFICE", "OTHER"];
    const addressType = validTypes.includes(type) ? type : existing.type;

    if (isDefault && !existing.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: customer.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.customerAddress.update({
      where: { id },
      data: {
        label: label || existing.label,
        type: addressType,
        fullName,
        phone,
        province,
        district: district || null,
        city,
        streetAddress: streetAddress || null,
        landmark: landmark || null,
        postalCode: postalCode || null,
        isDefault: isDefault !== undefined ? !!isDefault : existing.isDefault,
      },
    });

    return jsonResponse({ address });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADDRESS_UPDATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const customer = await requireCustomer();
    const { id } = await params;

    const existing = await prisma.customerAddress.findFirst({
      where: { id, customerId: customer.id },
    });
    if (!existing) return errorResponse("Address not found", 404);

    await prisma.customerAddress.delete({ where: { id } });

    if (existing.isDefault) {
      const next = await prisma.customerAddress.findFirst({
        where: { customerId: customer.id },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await prisma.customerAddress.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADDRESS_DELETE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
