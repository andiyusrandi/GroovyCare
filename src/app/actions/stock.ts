"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface StockTransactionPayload {
  productId: string;
  batchId?: string;
  type: "IN_IF" | "IN_PBF" | "IN_RETUR_CUSTOMER" | "OUT_SALE" | "OUT_RETUR_SUPPLIER" | "OUT_DISPOSAL";
  quantity: number;
  referenceNumber: string;
  sourceTargetId?: string;
  sourceTargetName: string;
}

export async function recordStockTransaction(payload: StockTransactionPayload) {
  try {
    // Record the stock transaction details in SQLite
    const tx = await db.stockTransaction.create({
      data: {
        productId: payload.productId,
        batchId: payload.batchId || null,
        type: payload.type,
        quantity: payload.quantity,
        referenceNumber: payload.referenceNumber,
        sourceTargetId: payload.sourceTargetId || null,
        sourceTargetName: payload.sourceTargetName,
      }
    });
    revalidatePath("/admin/dashboard");
    return { success: true, transaction: tx };
  } catch (error: any) {
    console.error("Failed to record stock transaction:", error);
    return { success: false, error: error.message };
  }
}

export async function getStockTransactions() {
  try {
    // Fetch all stock transaction records ordered by creation date
    const transactions = await db.stockTransaction.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, transactions };
  } catch (error: any) {
    console.error("Failed to get stock transactions:", error);
    return { success: false, error: error.message };
  }
}
