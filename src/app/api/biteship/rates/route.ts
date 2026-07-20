import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { destination_province, destination_city, destination_district, weight } = await request.json();
    console.log("BiteShip rates request body:", { destination_province, destination_city, destination_district, weight });

    if (!destination_province || !destination_city || !destination_district) {
      return NextResponse.json({ error: "Missing destination regional information" }, { status: 400 });
    }

    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "BiteShip API key not configured" }, { status: 500 });
    }

    // 1. Fetch Origin Area (PBF Warehouse in Tamalanrea) to extract its postal code
    const originSearchUrl = `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent("Tamalanrea, Makassar, 90245")}`;
    const originSearchRes = await fetch(originSearchUrl, {
      method: "GET",
      headers: {
        Authorization: apiKey,
      },
    });

    let originPostalCode = 90245; // Default fallback for Tamalanrea Makassar
    if (originSearchRes.ok) {
      const originData = await originSearchRes.json();
      if (originData.areas && originData.areas.length > 0) {
        const name = originData.areas[0].name || "";
        const match = name.match(/\b\d{5}\b/);
        if (match) {
          originPostalCode = parseInt(match[0]);
        }
      }
    }

    // 2. Fetch Destination Area based on Kecamatan, City, Province to extract its postal code
    const destInput = `${destination_district}, ${destination_city}, ${destination_province}`;
    const destSearchUrl = `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(destInput)}`;
    const destSearchRes = await fetch(destSearchUrl, {
      method: "GET",
      headers: {
        Authorization: apiKey,
      },
    });

    if (!destSearchRes.ok) {
      return NextResponse.json({ error: "Failed to resolve destination area with BiteShip" }, { status: destSearchRes.status });
    }

    const destData = await destSearchRes.json();
    if (!destData.areas || destData.areas.length === 0) {
      return NextResponse.json({ error: `Destination area not found for: ${destInput}` }, { status: 404 });
    }

    let destinationPostalCode = 12440; // Default fallback
    const destName = destData.areas[0].name || "";
    const destMatch = destName.match(/\b\d{5}\b/);
    if (destMatch) {
      destinationPostalCode = parseInt(destMatch[0]);
    }

    // 3. Query Rates API using Postal Codes (highly stable and fully mapped in Sandbox)
    const ratesUrl = "https://api.biteship.com/v1/rates/couriers";
    const ratesRes = await fetch(ratesUrl, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin_postal_code: originPostalCode,
        destination_postal_code: destinationPostalCode,
        couriers: "jne,sicepat,jnt,anteraja,tiki,grab,gojek",
        items: [
          {
            name: "Paket Obat-obatan (GroovyCare)",
            value: 250000,
            weight: weight || 1000, // weight in grams
          },
        ],
      }),
    });

    if (!ratesRes.ok) {
      const errorText = await ratesRes.text();
      console.warn("BiteShip rates API error:", errorText);
      return NextResponse.json(
        { error: "Layanan pengiriman sedang dalam pemeliharaan (Maintenance)" },
        { status: 503 }
      );
    }

    const ratesData = await ratesRes.json();
    return NextResponse.json(ratesData);
  } catch (error: any) {
    console.error("BiteShip rates proxy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
