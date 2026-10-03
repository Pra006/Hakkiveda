import { requireAdmin, jsonResponse, errorResponse } from "@/lib/admin";
import { uploadPublicImage } from "@/lib/cloudinary";
import cloudinary from "@/lib/cloudinary";
import crypto from "crypto";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

function uploadVideo(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "hakkiveda/video-rituals",
        resource_type: "video",
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

export async function POST(request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type");

    if (!file || typeof file === "string") return errorResponse("No file provided", 400);

    const publicId = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

    if (type === "video") {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return errorResponse("Invalid video type. Accepted: MP4, WebM, MOV.", 400);
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return errorResponse("Video too large. Maximum 100 MB.", 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadVideo(buffer, { public_id: publicId });
      return jsonResponse({ url: result.secure_url, publicId: result.public_id });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return errorResponse("Invalid image type. Accepted: JPG, PNG, WebP.", 400);
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return errorResponse("Image too large. Maximum 5 MB.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadPublicImage(buffer, {
      folder: "hakkiveda/video-rituals",
      publicId,
    });
    return jsonResponse({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[VIDEO_RITUAL_UPLOAD_ERROR]", err);
    return errorResponse("Upload failed", 500);
  }
}
