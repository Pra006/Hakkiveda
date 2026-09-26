import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOtp, hashOtp, OTP_EXPIRY_MINUTES } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/brevo";

export async function POST(request) {
  try {
    const { email, purpose } = await request.json();

    if (!email || !purpose) {
      return NextResponse.json(
        { error: "Email and purpose are required." },
        { status: 400 }
      );
    }

    if (!["CUSTOMER_REGISTRATION", "B2B_REGISTRATION"].includes(purpose)) {
      return NextResponse.json(
        { error: "Invalid purpose." },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();



    await prisma.otp.deleteMany({
      where: { email: emailLower, purpose, verified: false },
    });

    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    await prisma.otp.create({
      data: {
        email: emailLower,
        hashedOtp,
        purpose,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000),
      },
    });

    const emailResult = await sendOtpEmail({
      to: emailLower,
      otp,
      purpose,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "New code sent.",
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    console.error("[OTP_RESEND_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
