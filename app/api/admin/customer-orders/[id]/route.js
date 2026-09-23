import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import { isTransitionAllowed } from "@/lib/order-state-machine";
import prisma from "@/lib/prisma";
import { syncProductStock } from "@/lib/variants";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"];
const VALID_PAYMENT_STATUSES = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"];
const VALID_FULFILLMENT_STATUSES = ["UNFULFILLED", "PARTIALLY_FULFILLED", "FULFILLED", "RETURNED"];

export async function GET(request, { params }) {
  try {
    await requireAdmin("customer-orders");
    const { id } = await params;

    const order = await prisma.customerOrder.findUnique({
      where: { id },
      include: {
        customer: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } },
        billingAddress: true,
        shippingAddress: true,
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, images: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true, isActive: true } },
          },
        },
        payments: { orderBy: { createdAt: "desc" } },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) return errorResponse("Order not found", 404);
    return jsonResponse(order);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_ORDER_DETAIL_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { admin } = await requireAdmin("customer-orders");
    const { id } = await params;
    const body = await request.json();

    const order = await prisma.customerOrder.findUnique({ where: { id } });
    if (!order) return errorResponse("Order not found", 404);

    // Validate enums up-front
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return errorResponse("Invalid status", 400);
    }
    if (body.paymentStatus && !VALID_PAYMENT_STATUSES.includes(body.paymentStatus)) {
      return errorResponse("Invalid paymentStatus", 400);
    }
    if (body.fulfillmentStatus && !VALID_FULFILLMENT_STATUSES.includes(body.fulfillmentStatus)) {
      return errorResponse("Invalid fulfillmentStatus", 400);
    }

    // Enforce valid state-machine transitions
    if (body.status && body.status !== order.status) {
      if (!isTransitionAllowed("order", order.status, body.status)) {
        return errorResponse(
          `Cannot transition order from ${order.status} to ${body.status}`,
          409
        );
      }
    }
    if (body.paymentStatus && body.paymentStatus !== order.paymentStatus) {
      if (!isTransitionAllowed("payment", order.paymentStatus, body.paymentStatus)) {
        return errorResponse(
          `Cannot transition payment from ${order.paymentStatus} to ${body.paymentStatus}`,
          409
        );
      }
    }
    if (body.fulfillmentStatus && body.fulfillmentStatus !== order.fulfillmentStatus) {
      if (!isTransitionAllowed("fulfillment", order.fulfillmentStatus, body.fulfillmentStatus)) {
        return errorResponse(
          `Cannot transition fulfillment from ${order.fulfillmentStatus} to ${body.fulfillmentStatus}`,
          409
        );
      }
    }

    const updates = {};
    // Status + notes (existing behaviour)
    if (body.status) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;

    // Payment + fulfillment
    if (body.paymentStatus) updates.paymentStatus = body.paymentStatus;
    if (body.fulfillmentStatus) updates.fulfillmentStatus = body.fulfillmentStatus;

    // Delivery / tracking
    if (body.shippingMethod !== undefined) updates.shippingMethod = body.shippingMethod || null;
    if (body.courier !== undefined) updates.courier = body.courier || null;
    if (body.trackingNumber !== undefined) updates.trackingNumber = body.trackingNumber || null;
    if (body.shippedAt !== undefined) updates.shippedAt = body.shippedAt ? new Date(body.shippedAt) : null;
    if (body.deliveredAt !== undefined) updates.deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : null;
    if (body.estimatedDeliveryDate !== undefined) {
      updates.estimatedDeliveryDate = body.estimatedDeliveryDate ? new Date(body.estimatedDeliveryDate) : null;
    }

    // Auto-stamp shippedAt / deliveredAt when status transitions
    if (body.status === "SHIPPED" && !order.shippedAt && updates.shippedAt === undefined) {
      updates.shippedAt = new Date();
    }
    if (body.status === "DELIVERED" && !order.deliveredAt && updates.deliveredAt === undefined) {
      updates.deliveredAt = new Date();
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse("No valid fields to update", 400);
    }

    // Statuses in which the customer no longer holds the goods, so the reserved
    // stock belongs back in inventory.
    const RESTOCK_STATUSES = ["CANCELLED", "RETURNED", "REFUNDED"];
    const wasRestocked = RESTOCK_STATUSES.includes(order.status);
    const willRestock = body.status && RESTOCK_STATUSES.includes(body.status);

    // Terminal states are final — reopening one would double-count inventory.
    if (wasRestocked && body.status && body.status !== order.status) {
      return errorResponse(
        `Order is ${order.status} and cannot be moved to ${body.status}`,
        409
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.customerOrder.update({ where: { id }, data: updates });

      // Return stock exactly once, on the transition into a restock status.
      if (willRestock && !wasRestocked) {
        const items = await tx.customerOrderItem.findMany({
          where: { orderId: id },
          select: { productId: true, variantId: true, quantity: true },
        });
        const touchedProducts = new Set();
        for (const item of items) {
          // Return units to the variant that supplied them; fall back to the
          // product when the line had no option or the option has since gone.
          if (item.variantId) {
            const restored = await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            if (restored.count > 0) {
              touchedProducts.add(item.productId);
              continue;
            }
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        for (const productId of touchedProducts) {
          await syncProductStock(tx, productId);
        }
      }

      // Timeline event for meaningful transitions
      const events = [];
      if (body.status && body.status !== order.status) {
        events.push({
          orderId: id,
          status: body.status,
          message: `Status changed from ${order.status} to ${body.status}`,
          actor: "ADMIN",
          actorId: admin.id,
        });
      }
      if (body.paymentStatus && body.paymentStatus !== order.paymentStatus) {
        events.push({
          orderId: id,
          message: `Payment status changed from ${order.paymentStatus} to ${body.paymentStatus}`,
          actor: "ADMIN",
          actorId: admin.id,
        });
      }
      if (body.fulfillmentStatus && body.fulfillmentStatus !== order.fulfillmentStatus) {
        events.push({
          orderId: id,
          message: `Fulfillment changed from ${order.fulfillmentStatus} to ${body.fulfillmentStatus}`,
          actor: "ADMIN",
          actorId: admin.id,
        });
      }
      if (body.trackingNumber && body.trackingNumber !== order.trackingNumber) {
        events.push({
          orderId: id,
          message: `Tracking updated: ${body.courier || order.courier || "Courier"} #${body.trackingNumber}`,
          actor: "ADMIN",
          actorId: admin.id,
        });
      }
      if (willRestock && !wasRestocked) {
        events.push({
          orderId: id,
          message: `Inventory returned to stock (${body.status.toLowerCase()})`,
          actor: "ADMIN",
          actorId: admin.id,
        });
      }
      if (events.length > 0) {
        await tx.customerOrderEvent.createMany({ data: events });
      }

      return u;
    });

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "CustomerOrder",
      entityId: id,
      description: `Updated order ${order.orderNumber}`,
      metadata: { before: {
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
      }, updates },
      ipAddress,
    });

    return jsonResponse(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_ORDER_UPDATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
