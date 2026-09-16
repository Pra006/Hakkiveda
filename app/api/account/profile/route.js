import prisma from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/b2b";
import { auth } from "@/lib/auth";

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Authentication required", 401);

    const { firstName, lastName, phone } = await request.json();

    if (!firstName?.trim()) return errorResponse("First name is required", 400);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        phone: phone?.trim() || null,
        name: [firstName.trim(), lastName?.trim()].filter(Boolean).join(" "),
      },
      select: { firstName: true, lastName: true, phone: true, email: true },
    });

    return jsonResponse({ user });
  } catch (err) {
    console.error("[PROFILE_UPDATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
