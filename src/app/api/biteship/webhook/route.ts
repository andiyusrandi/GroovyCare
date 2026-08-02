import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { BITESHIP_STATUS_MAP } from "@/lib/biteship-status";
import { rejectOrder } from "@/app/actions/orders";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("BiteShip Webhook received:", JSON.stringify(body, null, 2));

    const event = body.event || body.type;
    const trackingId = body.courier_tracking_id || body.tracking_id || body.courier_waybill_id;
    const biteshipId = body.order_id || body.id;
    const orderReference = body.order_reference_id || body.reference_id || body.order_number;
    const status = (body.status || "").toLowerCase();

    const statusMeta = BITESHIP_STATUS_MAP[status] || {
      label: status.toUpperCase(),
      description: body.note || body.description || "Status diperbarui dari Biteship",
    };
    const statusFullText = `${statusMeta.label}: ${statusMeta.description}`;

    if (event === "order.status" || event === "order.waybill" || status) {
      // Find order by orderNumber (reference_id), tracking number (resi), or Biteship Order ID
      const order = await db.order.findFirst({
        where: {
          OR: [
            orderReference ? { orderNumber: orderReference } : {},
            trackingId ? { trackingNumber: trackingId } : {},
            biteshipId ? { biteshipOrderId: biteshipId } : {},
          ].filter((cond) => Object.keys(cond).length > 0),
        },
      });

      if (order) {
        if (status === "delivered") {
          await db.order.update({
            where: { id: order.id },
            data: {
              status: "DELIVERED",
              deliveredAt: (order as any).deliveredAt || new Date(),
              autoConfirmed: true,
              biteshipStatus: status,
              biteshipStatusLabel: statusFullText,
              ...(trackingId ? { trackingNumber: trackingId } : {}),
            } as any,
          });
          console.log(`Order ${order.orderNumber} status updated to DELIVERED via BiteShip webhook.`);
        } else if (
          status === "picked" ||
          status === "in_transit" ||
          status === "dropping_off" ||
          status === "allocated" ||
          status === "picking_up" ||
          status === "confirmed" ||
          status === "on_hold" ||
          status === "return_in_transit"
        ) {
          await db.order.update({
            where: { id: order.id },
            data: {
              status: "SHIPPED",
              shippingDate: order.shippingDate || new Date(),
              biteshipStatus: status,
              biteshipStatusLabel: statusFullText,
              ...(trackingId ? { trackingNumber: trackingId } : {}),
            } as any,
          });
          console.log(`Order ${order.orderNumber} status updated to SHIPPED (${statusFullText}) via BiteShip webhook.`);
        } else if (status === "cancelled" || status === "rejected" || status === "disposed" || status === "returned" || status === "courier_not_found" || status === "on_hold_canceled") {
          const reasonText = `Dibatalkan oleh Ekspedisi Biteship: ${statusMeta.description || status}`;
          if (order.status !== "REJECTED") {
            await rejectOrder(order.id, reasonText);
          }
          await db.order.update({
            where: { id: order.id },
            data: {
              biteshipStatus: status,
              biteshipStatusLabel: statusFullText,
            } as any,
          });
          console.log(`Order ${order.orderNumber} status updated to REJECTED (Biteship Cancellation) via BiteShip webhook.`);
        }

        // Trigger UI cache revalidation for real-time update
        try {
          revalidatePath("/customer/dashboard");
          revalidatePath("/admin/dashboard");
        } catch (e) {
          // Ignore if called outside request context
        }
      } else {
        console.warn(`No order found matching tracking number (${trackingId}) or Biteship ID (${biteshipId})`);
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error: any) {
    console.error("BiteShip webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
