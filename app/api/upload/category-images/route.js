import { requireAdmin, jsonResponse, errorResponse } from "@/lib/admin";
import { uploadPublicImage } from "@/lib/cloudinary";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request) {
  try {
    await requireAdmin("categories");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") return errorResponse("No file provided", 400);
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse("Invalid file type. Accepted: JPG, PNG, WebP.", 400);
    }
    if (file.size > MAX_SIZE) {
      return errorResponse("File too large. Maximum 5 MB.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicId = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const result = await uploadPublicImage(buffer, {
      folder: "hakkiveda/categories",
      publicId,
    });

    return jsonResponse({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[CATEGORY_IMAGE_UPLOAD_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
