import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateFile, uploadPrivateDocument } from "@/lib/cloudinary";
import crypto from "crypto";

export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id || crypto.randomUUID();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validationError = validateFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicId = `${userId}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const result = await uploadPrivateDocument(buffer, { public_id: publicId });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error("[PRIVATE_UPLOAD_ERROR]", error?.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
