import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/brevo";

const TOKEN_EXPIRY_MINUTES = 30;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 3;

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return Response.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Always return success to avoid email enumeration
    const successResponse = Response.json({
      message: "If an account exists with this email, a password reset link has been sent.",
    });

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, hashedPassword: true, isActive: true },
    });

    // Silently succeed if user doesn't exist, is OAuth-only, or is inactive
    if (!user || !user.hashedPassword || !user.isActive) {
      return successResponse;
    }

    // Rate limit: max N reset requests per window per user
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentCount = await prisma.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gte: windowStart } },
    });
    if (recentCount >= MAX_REQUESTS_PER_WINDOW) {
      return successResponse;
    }

    // Generate a cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(rawToken, 10);

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        hashedToken,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendPasswordResetEmail({ to: normalizedEmail, resetUrl });

    return successResponse;
  } catch (err) {
    console.error("[FORGOT_PASSWORD_ERROR]", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
