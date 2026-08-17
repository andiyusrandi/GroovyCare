import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET() {
  return NextResponse.json({ success: true, status: "Top-Up Midtrans Webhook Active" });
}

export async function POST(request: Request) {
  try {
    const rawText = await request.text();
    if (!rawText || rawText.trim() === "") {
      return NextResponse.json({ success: true, message: "Empty body" });
    }

    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch (e) {
      return NextResponse.json({ success: true, message: "Invalid JSON" });
    }

    console.log("[MIDTRANS TOPUP WEBHOOK RECEIVED]:", JSON.stringify(body, null, 2));

    const orderId = body.order_id || body.orderId;
    const transactionStatus = (body.transaction_status || "").toLowerCase();
    const fraudStatus = (body.fraud_status || "").toLowerCase();

    if (!orderId || !orderId.startsWith("TOPUP-")) {
      return NextResponse.json({ success: true, message: "Ignored (not a topup order)" });
    }

    const topUpReq = await (db as any).topUpRequest.findFirst({
      where: {
        OR: [
          { midtransOrderId: orderId },
          { topUpNumber: orderId.replace("TOPUP-", "") },
        ],
      },
    });

    if (!topUpReq) {
      console.warn(`[MIDTRANS TOPUP WEBHOOK]: TopUpRequest for ${orderId} not found in DB.`);
      return NextResponse.json({ success: true, message: "Order not found" });
    }

    // Midtrans Payment Success condition
    const isPaid =
      transactionStatus === "settlement" ||
      (transactionStatus === "capture" && (fraudStatus === "accept" || !fraudStatus));

    if (isPaid) {
      // Set status to PAID_WAITING_APPROVAL (Saldo Deposit DOES NOT increment yet until dev approves!)
      if (topUpReq.paymentStatus !== "APPROVED") {
        await (db as any).topUpRequest.update({
          where: { id: topUpReq.id },
          data: {
            paymentStatus: "PAID_WAITING_APPROVAL",
            paidAt: new Date(),
          },
        });
        console.log(`[MIDTRANS TOPUP WEBHOOK SUCCESS]: TopUp ${topUpReq.topUpNumber} marked as PAID_WAITING_APPROVAL.`);
      }
    } else if (transactionStatus === "deny" || transactionStatus === "cancel" || transactionStatus === "expire") {
      if (topUpReq.paymentStatus === "PENDING_PAYMENT") {
        await (db as any).topUpRequest.update({
          where: { id: topUpReq.id },
          data: {
            paymentStatus: "REJECTED",
            rejectionReason: `Pembayaran Gagal / Dibatalkan di Midtrans (${transactionStatus})`,
          },
        });
      }
    }

    revalidatePath("/admin/dashboard");
    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("[MIDTRANS TOPUP WEBHOOK ERROR]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
