import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const video = await prisma.videoRitual.findUnique({ where: { id } });
    if (!video) return errorResponse("Video not found", 404);

    return jsonResponse(video);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[VIDEO_RITUAL_GET_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { admin } = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.videoRitual.findUnique({ where: { id } });
    if (!existing) return errorResponse("Video not found", 404);

    const data = {};
    if (body.title !== undefined) {
      if (!body.title?.trim()) return errorResponse("Title cannot be empty", 400);
      data.title = body.title.trim();
    }
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.videoUrl !== undefined) {
      if (!body.videoUrl?.trim()) return errorResponse("Video URL cannot be empty", 400);
      data.videoUrl = body.videoUrl.trim();
    }
    if (body.thumbnailUrl !== undefined) data.thumbnailUrl = body.thumbnailUrl?.trim() || null;
    if (body.category !== undefined) data.category = body.category?.trim() || null;
    if (body.displayOrder !== undefined) data.displayOrder = body.displayOrder;
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const video = await prisma.videoRitual.update({
      where: { id },
      data,
    });

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "VideoRitual",
      entityId: video.id,
      description: `Updated video ritual: ${video.title}`,
    });

    return jsonResponse(video);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[VIDEO_RITUAL_UPDATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { admin } = await requireAdmin();
    const { id } = await params;

    const existing = await prisma.videoRitual.findUnique({ where: { id } });
    if (!existing) return errorResponse("Video not found", 404);

    await prisma.videoRitual.delete({ where: { id } });

    await createAuditLog({
      adminId: admin.id,
      action: "DELETE",
      entityType: "VideoRitual",
      entityId: id,
      description: `Deleted video ritual: ${existing.title}`,
    });

    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[VIDEO_RITUAL_DELETE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
