import prisma from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/b2b";
import { requireCustomer } from "@/lib/cart";

export async function GET() {
  try {
    const customer = await requireCustomer();
    const addresses = await prisma.customerAddress.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return jsonResponse({ addresses });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADDRESS_LIST_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request) {
  try {
    const customer = await requireCustomer();
    const body = await request.json();

    const { label, type, fullName, phone, province, district, city, streetAddress, landmark, postalCode, isDefault } = body;

    if (!fullName || !phone || !province || !city) {
      return errorResponse("Full name, phone, province, and city are required", 400);
    }

    const validTypes = ["HOME", "OFFICE", "OTHER"];
    const addressType = validTypes.includes(type) ? type : "HOME";

    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: customer.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        label: label || (addressType === "OFFICE" ? "Office" : "Home"),
        type: addressType,
        fullName,
        phone,
        province,
        district: district || null,
        city,
        streetAddress: streetAddress || null,
        landmark: landmark || null,
        postalCode: postalCode || null,
        isDefault: !!isDefault,
      },
    });

    return jsonResponse({ address }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADDRESS_CREATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
