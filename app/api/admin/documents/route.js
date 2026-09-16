import { requireAdmin, jsonResponse, errorResponse } from "@/lib/admin";

export async function GET(request) {
  try {
    await requireAdmin("b2b.applications");

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return errorResponse("Document URL is required", 400);
    }

    // For local files served via /api/upload/private/serve/*, the URL is already accessible to admins
    if (url.startsWith("/api/upload/private/serve/")) {
      return jsonResponse({ signedUrl: url });
    }

    // For legacy Cloudinary URLs, generate a signed URL
    try {
      const { generateSignedUrl } = await import("@/lib/cloudinary");
      const publicIdMatch = url.match(/\/b2b-documents\/([^/.]+)/);
      if (!publicIdMatch) {
        return errorResponse("Invalid document URL", 400);
      }
      const publicId = `b2b-documents/${publicIdMatch[1]}`;
      const isPdf = url.includes(".pdf");
      const signedUrl = generateSignedUrl(publicId, {
        resource_type: isPdf ? "raw" : "image",
      });
      return jsonResponse({ signedUrl });
    } catch {
      return jsonResponse({ signedUrl: url });
    }
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_DOCUMENT_ERROR]", err);
    return errorResponse("Failed to generate document URL", 500);
  }
}
