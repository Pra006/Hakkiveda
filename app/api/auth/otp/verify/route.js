import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  compareOtp,
  generateVerifyToken,
  MAX_ATTEMPTS,
  VERIFY_TOKEN_GRACE_MINUTES,
} from "@/lib/otp";
import { rateLimitByIP } from "@/lib/rate-limit";
import { isValidOtp, isValidEmail } from "@/lib/validation";

export async function POST(request) {
  try {
    const rateLimited = rateLimitByIP(request, "otp-verify");
    if (rateLimited) return rateLimited;

    const { email, otp, purpose } = await request.json();

    if (!email || !otp || !purpose) {
      return NextResponse.json(
        { error: "Email, OTP, and purpose are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    if (!isValidOtp(otp)) {
      return NextResponse.json(
        { error: "OTP must be exactly 6 digits." },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    const record = await prisma.otp.findFirst({
      where: {
        email: emailLower,
        purpose,
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    if (record.expiresAt < new Date() || record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Code expired or too many attempts. Request a new one." },
        { status: 400 }
      );
    }

    await prisma.otp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    const isValid = await compareOtp(otp, record.hashedOtp);

    if (!isValid) {
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      return NextResponse.json(
        {
          error: "Incorrect verification code.",
          attemptsRemaining: remaining,
        },
        { status: 400 }
      );
    }

    const verifyToken = generateVerifyToken();

    await prisma.otp.update({
      where: { id: record.id },
      data: {
        verified: true,
        verifyToken,
        expiresAt: new Date(
          Date.now() + VERIFY_TOKEN_GRACE_MINUTES * 60_000
        ),
      },
    });

    return NextResponse.json({ verified: true, verifyToken });
  } catch (error) {
    console.error("[OTP_VERIFY_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
