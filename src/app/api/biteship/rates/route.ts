import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination_province, destination_city, destination_district, weight } = body;
    console.log("BiteShip rates request body:", { destination_province, destination_city, destination_district, weight });

    // Defaults for missing regional info
    const prov = (destination_province || "Sulawesi Selatan").trim();
    const city = (destination_city || "Kota Makassar").trim();
    const dist = (destination_district || "Tamalanrea").trim();
    const totalWeight = weight || 1000;

    const apiKey = process.env.BITESHIP_API_KEY;

    // Helper fallback list of realistic Biteship courier options
    const getFallbackPricing = () => {
      const isMakassar = city.toLowerCase().includes("makassar") || prov.toLowerCase().includes("sulawesi selatan");
      const pricing: any[] = [];

      if (isMakassar) {
        pricing.push({
          available_for_cash_on_delivery: true,
          available_for_proof_of_delivery: true,
          available_for_instant_waybill_id: true,
          courier_name: "Logistik Groovyrx",
          courier_code: "groovyrx",
          courier_service_name: "Same Day",
          courier_service_code: "same_day",
          description: "Pengiriman Same Day Kurir Internal PBF (Makassar Area)",
          duration: "Same Day (1-2 Jam)",
          shipment_duration_range: "1 - 2",
          shipment_duration_unit: "hours",
          service_type: "same_day",
          shipping_type: "parcel",
          price: 35000,
          type: "same_day"
        });
      }

      pricing.push(
        {
          available_for_cash_on_delivery: true,
          available_for_proof_of_delivery: true,
          courier_name: "JNE",
          courier_code: "jne",
          courier_service_name: "Reguler (REG)",
          courier_service_code: "reg",
          description: "Layanan Reguler JNE Express",
          duration: "2 - 3 Hari",
          shipment_duration_range: "2 - 3",
          shipment_duration_unit: "days",
          service_type: "standard",
          shipping_type: "parcel",
          price: Math.round((42000 * (totalWeight / 1000))),
          type: "reg"
        },
        {
          available_for_cash_on_delivery: true,
          available_for_proof_of_delivery: true,
          courier_name: "J&T Express",
          courier_code: "jnt",
          courier_service_name: "EZ (Standard)",
          courier_service_code: "ez",
          description: "Pengiriman Reguler J&T Express",
          duration: "2 - 3 Hari",
          shipment_duration_range: "2 - 3",
          shipment_duration_unit: "days",
          service_type: "standard",
          shipping_type: "parcel",
          price: Math.round((38000 * (totalWeight / 1000))),
          type: "ez"
        },
        {
          available_for_cash_on_delivery: true,
          available_for_proof_of_delivery: true,
          courier_name: "SiCepat",
          courier_code: "sicepat",
          courier_service_name: "HALU (Ekonomis)",
          courier_service_code: "halu",
          description: "Layanan Ekonomis SiCepat Halu",
          duration: "3 - 4 Hari",
          shipment_duration_range: "3 - 4",
          shipment_duration_unit: "days",
          service_type: "economy",
          shipping_type: "parcel",
          price: Math.round((32000 * (totalWeight / 1000))),
          type: "halu"
        },
        {
          available_for_cash_on_delivery: true,
          available_for_proof_of_delivery: true,
          courier_name: "Anteraja",
          courier_code: "anteraja",
          courier_service_name: "Reguler",
          courier_service_code: "reg",
          description: "Pengiriman Reguler Anteraja",
          duration: "2 - 3 Hari",
          shipment_duration_range: "2 - 3",
          shipment_duration_unit: "days",
          service_type: "standard",
          shipping_type: "parcel",
          price: Math.round((36000 * (totalWeight / 1000))),
          type: "reg"
        }
      );

      return { success: true, pricing };
    };

    if (!apiKey) {
      return NextResponse.json(getFallbackPricing());
    }

    // 1. Fetch Origin Area (PBF Warehouse in Tamalanrea)
    let originPostalCode = 90245;
    try {
      const originSearchUrl = `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent("Tamalanrea, Makassar, 90245")}`;
      const originSearchRes = await fetch(originSearchUrl, {
        headers: { Authorization: apiKey },
      });
      if (originSearchRes.ok) {
        const originData = await originSearchRes.json();
        if (originData.areas && originData.areas.length > 0) {
          const match = (originData.areas[0].name || "").match(/\b\d{5}\b/);
          if (match) originPostalCode = parseInt(match[0]);
        }
      }
    } catch (e) {
      console.warn("Origin search error:", e);
    }

    // 2. Fetch Destination Area (Multi-Step search: district+city+prov -> city+prov -> prov)
    let destinationPostalCode = 90245;
    let foundArea = false;

    const searchQueries = [
      `${dist}, ${city}, ${prov}`,
      `${city}, ${prov}`,
      `${prov}`
    ];

    for (const q of searchQueries) {
      try {
        const destSearchRes = await fetch(`https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(q)}`, {
          headers: { Authorization: apiKey },
        });
        if (destSearchRes.ok) {
          const destData = await destSearchRes.json();
          if (destData.areas && destData.areas.length > 0) {
            const destMatch = (destData.areas[0].name || "").match(/\b\d{5}\b/);
            if (destMatch) {
              destinationPostalCode = parseInt(destMatch[0]);
              foundArea = true;
              break;
            }
          }
        }
      } catch (e) {
        console.warn(`Destination search error for '${q}':`, e);
      }
    }

    // 3. Query Rates API using Postal Codes
    try {
      const ratesRes = await fetch("https://api.biteship.com/v1/rates/couriers", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin_postal_code: originPostalCode,
          destination_postal_code: destinationPostalCode,
          couriers: "jne,sicepat,jnt,anteraja,tiki,grab,gojek,custom",
          items: [
            {
              name: "Paket Obat-obatan (GroovyCare)",
              value: 250000,
              weight: totalWeight,
            },
          ],
        }),
      });

      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        const hasGroovyRx = ratesData.pricing?.some((p: any) =>
          p.courier_name?.toLowerCase().includes("groovyrx") || p.courier_code?.toLowerCase().includes("groovyrx")
        );

        const isMakassar = city.toLowerCase().includes("makassar") || prov.toLowerCase().includes("sulawesi selatan");
        if (!hasGroovyRx && isMakassar) {
          if (!ratesData.pricing) ratesData.pricing = [];
          ratesData.pricing.unshift({
            available_for_cash_on_delivery: true,
            available_for_proof_of_delivery: true,
            available_for_instant_waybill_id: true,
            courier_name: "Logistik Groovyrx",
            courier_code: "groovyrx",
            courier_service_name: "Same Day",
            courier_service_code: "same_day",
            description: "Pengiriman Same Day Kurir Internal PBF (Makassar Area)",
            duration: "Same Day (1-2 Jam)",
            shipment_duration_range: "1 - 2",
            shipment_duration_unit: "hours",
            service_type: "same_day",
            shipping_type: "parcel",
            price: 35000,
            type: "same_day"
          });
        }

        if (ratesData.pricing && ratesData.pricing.length > 0) {
          return NextResponse.json({ success: true, ...ratesData });
        }
      }
    } catch (e) {
      console.warn("Rates API call error:", e);
    }

    // Fallback if Biteship API is unreachable or returned empty pricing
    return NextResponse.json(getFallbackPricing());
  } catch (error: any) {
    console.error("BiteShip rates proxy error:", error);
    return NextResponse.json({
      success: true,
      pricing: [
        {
          courier_name: "Logistik Groovyrx",
          courier_code: "groovyrx",
          courier_service_name: "Same Day",
          courier_service_code: "same_day",
          description: "Pengiriman Same Day Kurir Internal PBF (Makassar Area)",
          duration: "Same Day (1-2 Jam)",
          price: 35000,
          type: "same_day"
        },
        {
          courier_name: "JNE",
          courier_code: "jne",
          courier_service_name: "Reguler (REG)",
          courier_service_code: "reg",
          description: "Layanan Reguler JNE Express",
          duration: "2 - 3 Hari",
          price: 42000,
          type: "reg"
        }
      ]
    });
  }
}
