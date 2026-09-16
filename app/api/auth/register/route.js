import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateRefNumber } from "@/lib/ref-number";
import { VERIFY_TOKEN_GRACE_MINUTES } from "@/lib/otp";

export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, password, verifyToken } = body;

    // ---- validation ----
    if (!firstName || !email || !password) {
      return NextResponse.json(
        { error: "First name, email and password are required." },
        { status: 400 }
      );
    }

    if (!verifyToken) {
      return NextResponse.json(
        { error: "Email verification is required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // ---- check duplicates ----
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
      otpRecord.purpose !== "CUSTOMER_REGISTRATION" ||
      otpRecord.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Invalid or expired verification. Please verify your email again." },
        { status: 400 }
      );
    }

    // ---- create user + customer record in a transaction ----
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName?.trim() || null,
          email: emailLower,
          phone: phone?.trim() || null,
          hashedPassword,
          emailVerified: new Date(),
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          customerNumber: generateRefNumber("CUST"),
        },
      });

      await tx.otp.delete({ where: { id: otpRecord.id } });

      return { user, customer };
    });

    return NextResponse.json(
      {
        id: result.user.id,
        email: result.user.email,
        customerNumber: result.customer.customerNumber,
        message: "Account created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
