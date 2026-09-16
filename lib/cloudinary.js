import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Invalid file type. Accepted: JPG, JPEG, PNG, WebP, PDF.";
  }
  if (file.size > MAX_SIZE) {
    return "File too large. Maximum size is 5MB.";
  }
  return null;
}

export async function uploadPrivateDocument(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "b2b-documents",
        type: "upload",
        access_mode: "authenticated",
        resource_type: "auto",
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

export function generateSignedUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + 300, // 5 min
    ...options,
  });
}

export default cloudinary;
