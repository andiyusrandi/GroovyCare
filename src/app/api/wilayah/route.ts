import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const q = searchParams.get("q");

  let targetUrl = "";

  if (type === "provinces") {
    targetUrl = "https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json";
  } else if (type === "regencies" && id) {
    targetUrl = `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`;
  } else if (type === "districts" && id) {
    targetUrl = `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`;
  } else if (type === "villages" && id) {
    targetUrl = `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`;
  } else if (type === "postcode" && q) {
    targetUrl = `https://kodepos.vercel.app/search?q=${encodeURIComponent(q)}`;
  } else {
    return NextResponse.json({ error: "Invalid type or missing parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch from source: ${res.statusText}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
