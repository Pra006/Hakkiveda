import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { rateLimitByIP } from "@/lib/rate-limit";
import { isValidEmail, isValidPassword } from "@/lib/validation";

export async function POST(req) {
  try {
    const rateLimited = rateLimitByIP(req, "auth-strict");
    if (rateLimited) return rateLimited;

    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return Response.json({ error: "All fields are required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return Response.json({ error: "Invalid email format." }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return Response.json({ error: "Password must be 8-128 characters." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return Response.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    // Find all valid (unused, not expired) tokens for this user
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (resetTokens.length === 0) {
      return Response.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    // Verify the token against stored hashes
    let matchedToken = null;
    for (const rt of resetTokens) {
      const isValid = await bcrypt.compare(token, rt.hashedToken);
      if (isValid) {
        matchedToken = rt;
        break;
      }
    }

    if (!matchedToken) {
      return Response.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    // Hash the new password and update in a transaction
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: matchedToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return Response.json({
      message: "Your password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (err) {
    console.error("[RESET_PASSWORD_ERROR]", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
