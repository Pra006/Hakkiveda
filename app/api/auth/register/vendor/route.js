import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateRefNumber } from "@/lib/ref-number";
import { VERIFY_TOKEN_GRACE_MINUTES } from "@/lib/otp";

/**
 * POST /api/auth/register/vendor
 * Creates a User + B2BApplication (the "vendor" registration form submits here).
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      password,
      verifyToken,
      citizenshipNumber,
      citizenshipFrontUrl,
      citizenshipBackUrl,
      storeName,
      businessType,
      estimatedOrderVolume,
      businessRegNo,
      panVatNo,
      businessEmail,
      businessPhone,
      province,
      district,
      city,
      streetAddress,
      postalCode,
      storeDescription,
      categories,
    } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    if (!citizenshipNumber || !citizenshipFrontUrl || !citizenshipBackUrl) {
      return NextResponse.json(
        { error: "Citizenship number and document uploads are required." },
        { status: 400 }
      );
    }
    if (!storeName || !businessType || !province || !district || !city) {
      return NextResponse.json(
        { error: "Store name, business type, and address are required." },
        { status: 400 }
      );
    }
    if (!estimatedOrderVolume) {
      return NextResponse.json(
        { error: "Estimated order volume is required." },
        { status: 400 }
      );
    }
    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one product category." },
        { status: 400 }
      );
    }

    if (!verifyToken) {
      return NextResponse.json(
        { error: "Email verification is required." },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    if (phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone: phone.trim() },
      });
      if (phoneExists) {
        return NextResponse.json(
          { error: "An account with this phone number already exists." },
          { status: 409 }
        );
      }
    }

    // ---- verify OTP token ----
    const otpRecord = await prisma.otp.findUnique({
      where: { verifyToken },
    });

    if (
      !otpRecord ||
      !otpRecord.verified ||
      otpRecord.email !== emailLower ||
      otpRecord.purpose !== "B2B_REGISTRATION" ||
      otpRecord.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Invalid or expired verification. Please verify your email again." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || null;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email: emailLower,
          phone: phone?.trim() || null,
          hashedPassword,
          emailVerified: new Date(),
        },
      });

      await tx.otp.delete({ where: { id: otpRecord.id } });

      const now = new Date();

      const application = await tx.b2BApplication.create({
        data: {
          applicationNumber: generateRefNumber("B2B"),
          userId: user.id,
          contactPersonName: fullName.trim(),
          companyName: storeName.trim(),
          country: "Nepal",
          businessType,
          phone: phone?.trim() || businessPhone?.trim() || "",
          businessEmail: (businessEmail || emailLower).trim(),
          productsOfInterest: categories || [],
          citizenshipNumber: citizenshipNumber.trim(),
          citizenshipFrontUrl,
          citizenshipBackUrl,
          storeName: storeName.trim(),
          businessRegNo: businessRegNo?.trim() || null,
          panVatNo: panVatNo?.trim() || null,
          businessPhone: businessPhone?.trim() || null,
          province: province?.trim() || null,
          district: district?.trim() || null,
          city: city?.trim() || null,
          streetAddress: streetAddress?.trim() || null,
          postalCode: postalCode?.trim() || null,
          storeDescription: storeDescription?.trim() || null,
          productCategories: categories || [],
          estimatedOrderVolume: estimatedOrderVolume || null,
          termsAcceptedAt: now,
          privacyAcceptedAt: now,
        },
      });

      return { user, application };
    });

    return NextResponse.json(
      {
        id: result.user.id,
        applicationId: result.application.id,
        applicationNumber: result.application.applicationNumber,
        status: result.application.status,
        message: "B2B business application submitted successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[B2B_REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
