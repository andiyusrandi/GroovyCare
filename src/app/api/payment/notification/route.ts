import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

const serverKey = process.env.MIDTRANS_SERVER_KEY || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Midtrans webhook notification received:", body);

    const { order_id, status_code, gross_amount, signature_key, transaction_status } = body;

    // Verify signature key
    const hashed = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + serverKey)
      .digest("hex");

    if (hashed !== signature_key) {
      console.error("Signature key validation failed! Possible fraud/spoofing.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Ekstrak original order number (format: SP-YYYYMMDD-XXXX) dari order_id dengan suffix timestamp
    const originalOrderNumber = order_id.split("-").slice(0, 3).join("-");

    // Cari order berdasarkan orderNumber asli
    const order = await db.order.findUnique({
      where: { orderNumber: originalOrderNumber }
    });

    if (!order) {
      console.error(`Order with number ${originalOrderNumber} not found.`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Handle transaction status
    if (transaction_status === "capture" || transaction_status === "settlement") {
      // Update order payment status to PAID
      await db.order.update({
        where: { orderNumber: originalOrderNumber },
        data: { paymentStatus: "PAID" }
      });
      console.log(`Order ${originalOrderNumber} successfully marked as PAID.`);
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      // Update order payment status to UNPAID
      await db.order.update({
        where: { orderNumber: originalOrderNumber },
        data: { paymentStatus: "UNPAID" }
      });
      console.log(`Order ${originalOrderNumber} payment status set to UNPAID (failed transaction).`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error handling Midtrans notification webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
