import { requireAdmin, jsonResponse, errorResponse } from "@/lib/admin";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

const EXT_MAP = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(request) {
  try {
    await requireAdmin("products");

    const formData = await request.formData();
    const files = formData.getAll("files");

    if (!files.length) return errorResponse("No files provided", 400);
    if (files.length > 10) return errorResponse("Maximum 10 images per upload", 400);

    for (const file of files) {
      if (typeof file === "string") return errorResponse("Invalid file", 400);
      if (!ALLOWED_TYPES.includes(file.type)) {
        return errorResponse(`Invalid file type: ${file.name}. Accepted: JPG, PNG, WebP.`, 400);
      }
      if (file.size > MAX_SIZE) {
        return errorResponse(`${file.name} is too large. Maximum 5 MB.`, 400);
      }
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const results = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = EXT_MAP[file.type] || "jpg";
      const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
      await writeFile(path.join(UPLOAD_DIR, filename), buffer);
      results.push({ url: `/uploads/products/${filename}` });
    }

    return jsonResponse(results);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[PRODUCT_IMAGE_UPLOAD_ERROR]", err);
    return errorResponse(err?.message || "Upload failed", 500);
  }
}
