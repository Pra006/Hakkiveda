import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateFile } from "@/lib/cloudinary";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "private-uploads", "b2b-documents");

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
    const ext = file.name?.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${userId}_${Date.now()}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFile(filepath, buffer);

    const url = `/api/upload/private/serve/${filename}`;

    return NextResponse.json({
      url,
      publicId: filename,
      format: ext,
      bytes: buffer.length,
    });
  } catch (error) {
    console.error("[PRIVATE_UPLOAD_ERROR]", error?.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
