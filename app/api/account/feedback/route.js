import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/b2b";

const CATEGORIES = ["PRODUCT", "DELIVERY", "WEBSITE", "CUSTOMER_SERVICE", "OTHER"];
const MESSAGE_MAX = 2000;

/**
 * POST /api/account/feedback — submit customer feedback.
 *
 * Identity (userId, name, email) is taken from the authenticated session only.
 * The client cannot set who the feedback belongs to.
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Authentication required", 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const rating = Number(body?.rating);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const category = typeof body?.category === "string" ? body.category : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return errorResponse("Rating must be a whole number between 1 and 5", 400);
    }
    if (!message) {
      return errorResponse("Feedback message is required", 400);
    }
    if (message.length > MESSAGE_MAX) {
      return errorResponse(`Feedback message must be ${MESSAGE_MAX} characters or fewer`, 400);
    }
    if (!CATEGORIES.includes(category)) {
      return errorResponse("Please select a valid category", 400);
    }

    await prisma.feedback.create({
      data: {
        userId: session.user.id,
        rating,
        message,
        category,
      },
    });

    return jsonResponse(
      { success: true, message: "Thank you for your feedback! We appreciate your time." },
      201
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[FEEDBACK_SUBMIT_ERROR]", err);
    return errorResponse("Could not submit your feedback. Please try again.", 500);
  }
}
