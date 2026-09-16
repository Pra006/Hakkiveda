import prisma from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/b2b";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Authentication required", 401);

    const { currentPassword, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return errorResponse("New password must be at least 8 characters", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hashedPassword: true },
    });

    if (!user.hashedPassword) {
      return errorResponse("Your account uses Google sign-in. Password cannot be changed here.", 400);
    }

    if (!currentPassword) return errorResponse("Current password is required", 400);

    const valid = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!valid) return errorResponse("Current password is incorrect", 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { hashedPassword: hashed },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("[PASSWORD_CHANGE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
