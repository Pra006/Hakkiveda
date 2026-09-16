import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import { generateRefNumber } from "@/lib/ref-number";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    await requireAdmin("b2b.applications");
    const { id } = await params;

    const app = await prisma.b2BApplication.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true } },
        organization: { select: { id: true, organizationNumber: true, companyName: true, status: true } },
      },
    });

    if (!app) return errorResponse("Application not found", 404);

    const auditLogs = await prisma.adminAuditLog.findMany({
      where: { entityType: "B2BApplication", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        admin: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });

    return jsonResponse({ ...app, auditLogs });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_B2B_APP_DETAIL_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { admin } = await requireAdmin("b2b.applications");
    const { id } = await params;
    const body = await request.json();

    const app = await prisma.b2BApplication.findUnique({
      where: { id },
      include: { organization: true },
    });
    if (!app) return errorResponse("Application not found", 404);

    // Handle verification updates
    if (body.action === "verify_identity") {
      const status = body.verificationStatus;
      if (!["VERIFIED", "REJECTED"].includes(status)) {
        return errorResponse("Invalid verification status", 400);
      }
      const updated = await prisma.b2BApplication.update({
        where: { id },
        data: {
          identityStatus: status,
          identityVerifiedAt: new Date(),
          identityVerifiedById: admin.id,
        },
      });
      await createAuditLog({
        adminId: admin.id,
        action: "UPDATE",
        entityType: "B2BApplication",
        entityId: id,
        description: `Identity verification set to ${status} for ${app.applicationNumber}`,
        metadata: { field: "identityStatus", value: status },
      });
      return jsonResponse(updated);
    }

    if (body.action === "verify_business") {
      const status = body.verificationStatus;
      if (!["VERIFIED", "REJECTED"].includes(status)) {
        return errorResponse("Invalid verification status", 400);
      }
      const updated = await prisma.b2BApplication.update({
        where: { id },
        data: {
          businessInfoStatus: status,
          businessVerifiedAt: new Date(),
          businessVerifiedById: admin.id,
        },
      });
      await createAuditLog({
        adminId: admin.id,
        action: "UPDATE",
        entityType: "B2BApplication",
        entityId: id,
        description: `Business info verification set to ${status} for ${app.applicationNumber}`,
        metadata: { field: "businessInfoStatus", value: status },
      });
      return jsonResponse(updated);
    }

    // Handle status changes
    const validStatuses = [
      "PENDING", "UNDER_REVIEW", "CONTACT_REQUIRED",
      "MORE_INFORMATION_REQUIRED", "APPROVED", "REJECTED", "SUSPENDED",
    ];
    if (!body.status || !validStatuses.includes(body.status)) {
      return errorResponse("Invalid status", 400);
    }

    if (body.status === "APPROVED" && app.organization) {
      return errorResponse("Application already approved and organization exists", 400);
    }

    if (body.status === "SUSPENDED" && app.status !== "APPROVED") {
      return errorResponse("Only approved applications can be suspended", 400);
    }

    // Reinstate: SUSPENDED → APPROVED
    if (body.status === "APPROVED" && app.status === "SUSPENDED") {
      const updated = await prisma.b2BApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reinstatedAt: new Date(),
          reinstatedById: admin.id,
          suspendedReason: null,
        },
      });
      await createAuditLog({
        adminId: admin.id,
        action: "UPDATE",
        entityType: "B2BApplication",
        entityId: id,
        description: `Reinstated application ${app.applicationNumber}`,
        metadata: { from: "SUSPENDED", to: "APPROVED" },
      });
      return jsonResponse(updated);
    }

    if (body.status === "APPROVED") {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.b2BApplication.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedById: admin.id,
          },
        });

        const org = await tx.b2BOrganization.create({
          data: {
            organizationNumber: generateRefNumber("ORG"),
            b2bApplicationId: id,
            companyName: app.companyName || app.storeName,
            businessType: app.businessType,
            country: app.country || "Nepal",
            businessEmail: app.businessEmail,
            phone: app.phone,
            whatsapp: app.whatsapp,
          },
        });

        await tx.b2BOrganizationMember.create({
          data: {
            organizationId: org.id,
            userId: app.userId,
            role: "ORGANIZATION_OWNER",
            status: "ACTIVE",
          },
        });

        return { application: updated, organization: org };
      });

      await createAuditLog({
        adminId: admin.id,
        action: "APPROVE",
        entityType: "B2BApplication",
        entityId: id,
        description: `Approved application ${app.applicationNumber}, created org ${result.organization.organizationNumber}`,
        metadata: { organizationId: result.organization.id },
      });

      return jsonResponse(result, 200);
    }

    // MORE_INFORMATION_REQUIRED
    if (body.status === "MORE_INFORMATION_REQUIRED") {
      if (!body.moreInfoMessage?.trim()) {
        return errorResponse("A message explaining what information is needed is required", 400);
      }
      const updated = await prisma.b2BApplication.update({
        where: { id },
        data: {
          status: "MORE_INFORMATION_REQUIRED",
          moreInfoMessage: body.moreInfoMessage.trim(),
          moreInfoRequestedAt: new Date(),
        },
      });
      await createAuditLog({
        adminId: admin.id,
        action: "UPDATE",
        entityType: "B2BApplication",
        entityId: id,
        description: `Requested more information for ${app.applicationNumber}`,
        metadata: { from: app.status, to: "MORE_INFORMATION_REQUIRED", message: body.moreInfoMessage },
      });
      return jsonResponse(updated);
    }

    // REJECTED
    if (body.status === "REJECTED") {
      const updated = await prisma.b2BApplication.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectedById: admin.id,
          rejectionReason: body.rejectionReason || null,
          internalNotes: body.adminNotes || app.internalNotes,
        },
      });
      await createAuditLog({
        adminId: admin.id,
        action: "REJECT",
        entityType: "B2BApplication",
        entityId: id,
        description: `Rejected application ${app.applicationNumber}`,
        metadata: { from: app.status, to: "REJECTED", reason: body.rejectionReason },
      });
      return jsonResponse(updated);
    }

    // SUSPENDED
    if (body.status === "SUSPENDED") {
      if (!body.suspendedReason?.trim()) {
        return errorResponse("A suspension reason is required", 400);
      }
      const updated = await prisma.b2BApplication.update({
        where: { id },
        data: {
          status: "SUSPENDED",
          suspendedReason: body.suspendedReason.trim(),
          suspendedAt: new Date(),
          suspendedById: admin.id,
        },
      });
      await createAuditLog({
        adminId: admin.id,
        action: "UPDATE",
        entityType: "B2BApplication",
        entityId: id,
        description: `Suspended application ${app.applicationNumber}`,
        metadata: { from: app.status, to: "SUSPENDED", reason: body.suspendedReason },
      });
      return jsonResponse(updated);
    }

    // Generic status changes (UNDER_REVIEW, CONTACT_REQUIRED, PENDING)
    const updated = await prisma.b2BApplication.update({
      where: { id },
      data: { status: body.status, internalNotes: body.adminNotes || app.internalNotes },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "B2BApplication",
      entityId: id,
      description: `Changed application ${app.applicationNumber} status to ${body.status}`,
      metadata: { from: app.status, to: body.status },
    });

    return jsonResponse(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_B2B_APP_UPDATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
