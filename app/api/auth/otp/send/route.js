import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOtp, hashOtp, OTP_EXPIRY_MINUTES } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/brevo";
import { checkRateLimit } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";

export async function POST(request) {
  try {
    const { email, purpose } = await request.json();

    if (!email || !purpose) {
      return NextResponse.json(
        { error: "Email and purpose are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
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

    const rl = checkRateLimit(`otp:${emailLower}`, {
      windowMs: 60_000,
      maxRequests: 1,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Please wait before requesting another code.",
          retryAfterSeconds: rl.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const rlBurst = checkRateLimit(`otp-burst:${emailLower}`, {
      windowMs: 15 * 60_000,
      maxRequests: 5,
    });
    if (!rlBurst.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfterSeconds: rlBurst.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

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
      console.error("[OTP_EMAIL_FAILED]", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send verification code. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification code sent.",
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    console.error("[OTP_SEND_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
