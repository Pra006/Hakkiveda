import { requireAdmin, jsonResponse, errorResponse, parsePagination, paginatedResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { admin } = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";

    const where = search
      ? { title: { contains: search, mode: "insensitive" } }
      : {};

    const [videos, total] = await Promise.all([
      prisma.videoRitual.findMany({
        where,
        orderBy: { displayOrder: "asc" },
        skip,
        take: limit,
      }),
      prisma.videoRitual.count({ where }),
    ]);

    return paginatedResponse(videos, total, page, limit);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[VIDEO_RITUALS_LIST_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request) {
  try {
    const { admin } = await requireAdmin();
    const body = await request.json();

    const { title, description, videoUrl, thumbnailUrl, category, displayOrder, isActive } = body;

    if (!title?.trim()) return errorResponse("Title is required", 400);
    if (!videoUrl?.trim()) return errorResponse("Video URL is required", 400);

    const video = await prisma.videoRitual.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl?.trim() || null,
        category: category?.trim() || null,
        displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
        isActive: isActive ?? true,
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "CREATE",
      entityType: "VideoRitual",
      entityId: video.id,
      description: `Created video ritual: ${video.title}`,
    });

    return jsonResponse(video, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[VIDEO_RITUAL_CREATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
