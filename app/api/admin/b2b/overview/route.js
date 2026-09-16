import { requireAdmin, jsonResponse, errorResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin("b2b.applications");

    const [
      total,
      pending,
      underReview,
      moreInfoRequired,
      approved,
      rejected,
      suspended,
      contactRequired,
      activeOrgs,
    ] = await Promise.all([
      prisma.b2BApplication.count(),
      prisma.b2BApplication.count({ where: { status: "PENDING" } }),
      prisma.b2BApplication.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.b2BApplication.count({ where: { status: "MORE_INFORMATION_REQUIRED" } }),
      prisma.b2BApplication.count({ where: { status: "APPROVED" } }),
      prisma.b2BApplication.count({ where: { status: "REJECTED" } }),
      prisma.b2BApplication.count({ where: { status: "SUSPENDED" } }),
      prisma.b2BApplication.count({ where: { status: "CONTACT_REQUIRED" } }),
      prisma.b2BOrganization.count({ where: { status: "ACTIVE" } }),
    ]);

    const recentApplications = await prisma.b2BApplication.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        applicationNumber: true,
        companyName: true,
        storeName: true,
        status: true,
        createdAt: true,
      },
    });

    return jsonResponse({
      stats: {
        total,
        pending,
        underReview,
        moreInfoRequired,
        approved,
        rejected,
        suspended,
        contactRequired,
        activeOrgs,
      },
      recentApplications,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_B2B_OVERVIEW_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
