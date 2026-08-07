import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id") || searchParams.get("provinceId") || searchParams.get("regencyId") || searchParams.get("districtId");
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
    try {
      const res = await fetch(`https://kodepos.vercel.app/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          return NextResponse.json(data);
        }
      }
    } catch (e) {
      console.warn("Kodepos Vercel API warning:", e);
    }

    // Fallback to Biteship maps/areas if kodepos API returns no match
    const apiKey = process.env.BITESHIP_API_KEY;
    if (apiKey) {
      try {
        const bRes = await fetch(`https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(q)}`, {
          headers: { Authorization: apiKey }
        });
        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.areas && bData.areas.length > 0) {
            const postalCodes = bData.areas.map((a: any) => {
              const codeMatch = (a.name || "").match(/\b\d{5}\b/);
              return codeMatch ? { village: a.name, code: codeMatch[0], postalcode: codeMatch[0] } : null;
            }).filter(Boolean);

            if (postalCodes.length > 0) {
              return NextResponse.json({ statusCode: 200, status: true, data: postalCodes });
            }
          }
        }
      } catch (e) {
        console.warn("Biteship maps fallback warning:", e);
      }
    }

    return NextResponse.json({ statusCode: 200, status: true, data: [] });
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
