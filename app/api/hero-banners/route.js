import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/hero-banners
 * Public endpoint — returns active banners within their scheduled date range,
 * ordered by displayOrder.
 */
export async function GET() {
  try {
    const now = new Date();

    const banners = await prisma.heroBanner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        buttonText: true,
        buttonLink: true,
        badgeIcon: true,
        badgeLabel: true,
      },
    });

    return NextResponse.json(banners, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[PUBLIC_HERO_BANNERS]", err);
    return NextResponse.json([], { status: 200 });
  }
}
