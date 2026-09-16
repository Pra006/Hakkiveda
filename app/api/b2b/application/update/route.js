import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const application = await prisma.b2BApplication.findUnique({
      where: { userId: session.user.id },
    });

    if (!application) {
      return NextResponse.json({ error: "No application found" }, { status: 404 });
    }

    if (application.status !== "MORE_INFORMATION_REQUIRED") {
      return NextResponse.json(
        { error: "Application can only be updated when more information is requested" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      citizenshipNumber,
      citizenshipFrontUrl,
      citizenshipBackUrl,
      storeName,
      businessRegNo,
      panVatNo,
      businessPhone,
      province,
      district,
      city,
      streetAddress,
      postalCode,
      storeDescription,
      message,
    } = body;

    const updateData = { status: "PENDING" };

    if (citizenshipNumber) updateData.citizenshipNumber = citizenshipNumber.trim();
    if (citizenshipFrontUrl) updateData.citizenshipFrontUrl = citizenshipFrontUrl;
    if (citizenshipBackUrl) updateData.citizenshipBackUrl = citizenshipBackUrl;
    if (storeName) updateData.storeName = storeName.trim();
    if (businessRegNo !== undefined) updateData.businessRegNo = businessRegNo?.trim() || null;
    if (panVatNo !== undefined) updateData.panVatNo = panVatNo?.trim() || null;
    if (businessPhone !== undefined) updateData.businessPhone = businessPhone?.trim() || null;
    if (province) updateData.province = province.trim();
    if (district) updateData.district = district.trim();
    if (city) updateData.city = city.trim();
    if (streetAddress !== undefined) updateData.streetAddress = streetAddress?.trim() || null;
    if (postalCode !== undefined) updateData.postalCode = postalCode?.trim() || null;
    if (storeDescription !== undefined) updateData.storeDescription = storeDescription?.trim() || null;

    // Reset verification statuses when documents are re-uploaded
    if (citizenshipFrontUrl || citizenshipBackUrl) {
      updateData.identityStatus = "PENDING";
    }

    const updated = await prisma.b2BApplication.update({
      where: { id: application.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Application updated and resubmitted for review.",
      status: updated.status,
    });
  } catch (error) {
    console.error("[B2B_APP_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
