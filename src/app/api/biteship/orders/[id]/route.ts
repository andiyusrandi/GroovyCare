import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";

// GET /api/biteship/orders/[id] -> Retrieve Order from Biteship
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "BiteShip API key not configured" }, { status: 500 });
    }

    const res = await fetch(`https://api.biteship.com/v1/orders/${id}`, {
      method: "GET",
      headers: {
        Authorization: apiKey,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/biteship/orders/[id] -> Update or Cancel Order on Biteship
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "BiteShip API key not configured" }, { status: 500 });
    }

    const body = await request.json();
    const isCancel = request.url.endsWith("/cancel") || body.action === "cancel";

    const targetUrl = isCancel
      ? `https://api.biteship.com/v1/orders/${id}/cancel`
      : `https://api.biteship.com/v1/orders/${id}`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
