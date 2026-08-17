import { NextResponse } from "next/server";
import { resetBiteshipApiTransactions } from "@/app/actions/biteship";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const res = await resetBiteshipApiTransactions();
    return NextResponse.json(res, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mereset data log API" },
      { status: 500 }
    );
  }
}
