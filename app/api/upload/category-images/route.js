import { requireAdmin, jsonResponse, errorResponse } from "@/lib/admin";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "categories");

const EXT_MAP = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp" };

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

    await mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = EXT_MAP[file.type] || "jpg";
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return jsonResponse({ url: `/uploads/categories/${filename}` });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[CATEGORY_IMAGE_UPLOAD_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
