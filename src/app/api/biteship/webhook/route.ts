import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("BiteShip Webhook received:", body);

    const { event, courier_tracking_id, status } = body;

    if (event === "order.status" && courier_tracking_id) {
      // Find order by tracking number (resi)
      const order = await db.order.findFirst({
        where: {
          trackingNumber: courier_tracking_id,
        },
      });

      if (order) {
        if (status === "delivered") {
          await db.order.update({
            where: { id: order.id },
            data: {
              status: "DELIVERED",
            },
          });
          console.log(`Order ${order.orderNumber} status updated to DELIVERED via BiteShip webhook.`);
        } else if (status === "picked" || status === "in_transit") {
          await db.order.update({
            where: { id: order.id },
            data: {
              status: "SHIPPED",
              shippingDate: new Date(),
            },
          });
          console.log(`Order ${order.orderNumber} status updated to SHIPPED via BiteShip webhook.`);
        }
      } else {
        console.warn(`No order found matching tracking number: ${courier_tracking_id}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("BiteShip webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
