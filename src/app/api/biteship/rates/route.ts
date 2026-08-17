import { NextResponse } from "next/server";
import { recordBiteshipApiCall } from "@/app/actions/biteship";

export async function POST(request: Request) {
  try {
    // Record Rates API call count & pricing
    recordBiteshipApiCall("rates", 1).catch(() => {});

    const body = await request.json();
    const { destination_province, destination_city, destination_district, destination_village, destination_postal_code, weight } = body;
    console.log("BiteShip rates request body:", { destination_province, destination_city, destination_district, destination_village, destination_postal_code, weight });

    // Defaults & Clean inputs
    const prov = (destination_province || "Sulawesi Selatan").trim();
    const city = (destination_city || "Kota Makassar").trim();
    const dist = (destination_district || "Tamalanrea").replace(/\(Desa\/Kel:.*?\)/i, "").trim();
    const village = (destination_village || "").trim();
    const totalWeight = weight || 1000;

    let apiKey = process.env.BITESHIP_API_KEY;
    try {
      const { db } = await import("@/lib/db");
      const dbKey = await db.systemSetting.findUnique({ where: { key: "biteship_api_key" } });
      if (dbKey && dbKey.value && dbKey.value.trim().length > 0) {
        apiKey = dbKey.value.trim();
      }
    } catch (e) {}

    // Helper fallback list of realistic Biteship courier options
    const getFallbackPricing = () => {
      const isMakassar = city.toLowerCase().includes("makassar") || prov.toLowerCase().includes("sulawesi Selatan");
      const weightKg = totalWeight / 1000;
      const rawPricing: any[] = [];

      if (isMakassar) {
        rawPricing.push(
          {
            available_for_cash_on_delivery: true,
            available_for_proof_of_delivery: true,
            courier_name: "JNE",
            courier_code: "jne",
            courier_service_name: "Reguler (REG)",
            courier_service_code: "reg",
            description: "Layanan Reguler JNE Express Intra-City Makassar",
            duration: "1 - 2 Hari",
            shipment_duration_range: "1 - 2",
            shipment_duration_unit: "days",
            service_type: "standard",
            shipping_type: "parcel",
            price: Math.round(10000 * weightKg),
            type: "reg"
          },
          {
            available_for_cash_on_delivery: true,
            available_for_proof_of_delivery: true,
            courier_name: "J&T Express",
            courier_code: "jnt",
            courier_service_name: "EZ (Standard)",
            courier_service_code: "ez",
            description: "Pengiriman Reguler J&T Express Intra-City Makassar",
            duration: "1 - 2 Hari",
            shipment_duration_range: "1 - 2",
            shipment_duration_unit: "days",
            service_type: "standard",
            shipping_type: "parcel",
            price: Math.round(10000 * weightKg),
            type: "ez"
          },
          {
            available_for_cash_on_delivery: true,
            available_for_proof_of_delivery: true,
            courier_name: "SiCepat",
            courier_code: "sicepat",
            courier_service_name: "HALU (Ekonomis)",
            courier_service_code: "halu",
            description: "Layanan Ekonomis SiCepat Intra-City Makassar",
            duration: "1 - 2 Hari",
            shipment_duration_range: "1 - 2",
            shipment_duration_unit: "days",
            service_type: "economy",
            shipping_type: "parcel",
            price: Math.round(9000 * weightKg),
            type: "halu"
          },
          {
            available_for_cash_on_delivery: true,
            available_for_proof_of_delivery: true,
            courier_name: "Anteraja",
            courier_code: "anteraja",
            courier_service_name: "Reguler",
            courier_service_code: "reg",
            description: "Pengiriman Reguler Anteraja Intra-City Makassar",
            duration: "1 - 2 Hari",
            shipment_duration_range: "1 - 2",
            shipment_duration_unit: "days",
            service_type: "standard",
            shipping_type: "parcel",
            price: Math.round(10000 * weightKg),
            type: "reg"
          }
        );
      } else {
        rawPricing.push(
          {
            available_for_cash_on_delivery: true,
            available_for_proof_of_delivery: true,
            courier_name: "JNE",
            courier_code: "jne",
            courier_service_name: "Reguler (REG)",
            courier_service_code: "reg",
            description: "Layanan Reguler JNE Express Antar-Kota/Provinsi",
            duration: "2 - 3 Hari",
            shipment_duration_range: "2 - 3",
            shipment_duration_unit: "days",
            service_type: "standard",
            shipping_type: "parcel",
            price: Math.round(35000 * weightKg),
            type: "reg"
          },
          {
            available_for_cash_on_delivery: true,
            available_for_proof_of_delivery: true,
            courier_name: "J&T Express",
            courier_code: "jnt",
            courier_service_name: "EZ (Standard)",
            courier_service_code: "ez",
            description: "Pengiriman Reguler J&T Express Antar-Kota/Provinsi",
            duration: "2 - 3 Hari",
            shipment_duration_range: "2 - 3",
            shipment_duration_unit: "days",
            service_type: "standard",
            shipping_type: "parcel",
            price: Math.round(32000 * weightKg),
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
            price: Math.round(28000 * weightKg),
            type: "halu"
          }
        );
      }

      const pricing = rawPricing.map(p => ({
        ...p,
        is_fallback: true,
        fallback_label: "Tarif Estimasi (Price Fallback)"
      }));

      return { success: true, isFallback: true, pricing };
    };

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "BITESHIP_API_KEY belum disetel di server.",
        pricing: []
      }, { status: 400 });
    }

    // 1. Fetch Origin Area (PBF Warehouse in Tamalanrea)
    let originPostalCode = 90245;
    let originAreaId = "";
    try {
      const originSearchUrl = `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent("Tamalanrea, Makassar, 90245")}`;
      const originSearchRes = await fetch(originSearchUrl, {
        headers: { Authorization: apiKey },
      });
      if (originSearchRes.ok) {
        const originData = await originSearchRes.json();
        if (originData.areas && originData.areas.length > 0) {
          originAreaId = originData.areas[0].id || "";
          const match = (originData.areas[0].name || "").match(/\b\d{5}\b/);
          if (match) originPostalCode = parseInt(match[0]);
        }
      }
    } catch (e) {
      console.warn("Origin search error:", e);
    }

    // 2. Fetch Destination Area (Multi-Step search: district+city+prov -> district+city -> city+prov -> prov)
    let destinationAreaId = "";
    let destinationPostalCode = destination_postal_code ? parseInt(destination_postal_code) : 92811;

    const cleanCity = city.replace(/KABUPATEN\s+|KOTA\s+/i, "").trim();
    const cleanDist = dist.replace(/\(Desa\/Kel:.*?\)/i, "").trim();

    const searchQueries = [
      ...(destination_postal_code ? [`${cleanDist}, ${cleanCity}, ${destination_postal_code}`] : []),
      ...(village ? [`${village}, ${cleanDist}, ${cleanCity}`] : []),
      `${cleanDist}, ${cleanCity}, ${prov}`,
      `${cleanDist}, ${cleanCity}`,
      `${cleanCity}, ${prov}`,
      `${prov}`
    ].filter(Boolean);

    for (const q of searchQueries) {
      try {
        const destSearchRes = await fetch(`https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(q)}`, {
          headers: { Authorization: apiKey },
        });
        if (destSearchRes.ok) {
          const destData = await destSearchRes.json();
          if (destData.areas && destData.areas.length > 0) {
            const isDestMakassar = cleanCity.toLowerCase().includes("makassar");

            const matchedArea = destData.areas.find((a: any) => {
              const nameLower = (a.name || "").toLowerCase();
              if (!isDestMakassar && (nameLower.includes("makassar") || a.id.includes("IDNC182") || a.id.includes("IDND2571"))) {
                return false;
              }
              const matchesDist = cleanDist && cleanDist.length > 2 && nameLower.includes(cleanDist.toLowerCase());
              const matchesCity = cleanCity && cleanCity.length > 2 && nameLower.includes(cleanCity.toLowerCase());
              return matchesDist || matchesCity;
            });

            if (matchedArea) {
              destinationAreaId = matchedArea.id;
              console.log(`[BITESHIP AREA MATCHED] Query: '${q}' -> Area ID: ${destinationAreaId}, Name: ${matchedArea.name}`);
              const destMatch = (matchedArea.name || "").match(/\b\d{5}\b/);
              if (destMatch) {
                destinationPostalCode = parseInt(destMatch[0]);
              }
              break;
            }
          }
        }
      } catch (e) {
        console.warn(`Destination search error for '${q}':`, e);
      }
    }

    const isMakassarArea =
      city.toLowerCase().includes("makassar") ||
      city.toLowerCase().includes("gowa") ||
      city.toLowerCase().includes("maros") ||
      prov.toLowerCase().includes("sulawesi selatan");

    // 3. Query Rates API using Destination Area ID / Postal Code (with 2-tier fallback)
    try {
      const allCouriers = "gojek,grab,deliveree,jne,tiki,ninja,lion,sicepat,sentralcargo,jnt,idexpress,rpx,wahana,pos,tlx,jntcargo,anteraja,sap,paxel,borzo,lalamove,dash_express";
      const itemPayload = [
        {
          name: "Paket Sediaan Farmasi (GroovyCare)",
          description: "Produk sediaan farmasi & kesehatan terdaftar BPOM",
          category: "others",
          value: 250000,
          weight: totalWeight,
        },
      ];

      // Attempt 1: High Accuracy Area ID + Postal Code
      const authHeader = apiKey ? (apiKey.startsWith("biteship_") ? apiKey : `Bearer ${apiKey}`) : "";
      let ratesPayload: any = {
        origin_postal_code: originPostalCode,
        ...(originAreaId ? { origin_area_id: originAreaId } : {}),
        destination_postal_code: destinationPostalCode,
        ...(destinationAreaId ? { destination_area_id: destinationAreaId } : {}),
        couriers: allCouriers,
        items: itemPayload,
      };

      console.log("[BITESHIP CALLING RATES API Payload - Attempt 1]:", ratesPayload);

      let ratesRes = await fetch("https://api.biteship.com/v1/rates/couriers", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(ratesPayload),
      });

      let ratesData = await ratesRes.json();
      const isAuthError = ratesData.code === 40000001 || (ratesData.error && ratesData.error.includes("Authentication for your key is failed"));

      console.log("[BITESHIP RATES API RESULT - Attempt 1]:", {
        status: ratesRes.status,
        ok: ratesRes.ok,
        success: ratesData.success,
        pricingCount: ratesData.pricing?.length || 0,
        error: ratesData.error || ratesData.message
      });

      if (isAuthError) {
        console.warn("[BITESHIP RATES WARNING] Kunci BITESHIP_API_KEY di .env/environment tidak valid atau telah kedaluwarsa di Biteship Dashboard.");
      }

      // Attempt 2: If Attempt 1 returned no rates (and not an auth failure), retry using Postal Code query only
      if (!isAuthError && (!ratesRes.ok || !ratesData.success || !ratesData.pricing || ratesData.pricing.length === 0) && destinationPostalCode) {
        ratesPayload = {
          origin_postal_code: originPostalCode,
          destination_postal_code: destinationPostalCode,
          couriers: allCouriers,
          items: itemPayload,
        };

        console.log("[BITESHIP CALLING RATES API Payload - Attempt 2 (Postal Code Fallback)]:", ratesPayload);

        ratesRes = await fetch("https://api.biteship.com/v1/rates/couriers", {
          method: "POST",
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
          body: JSON.stringify(ratesPayload),
        });

        ratesData = await ratesRes.json();
        console.log("[BITESHIP RATES API RESULT - Attempt 2]:", {
          status: ratesRes.status,
          ok: ratesRes.ok,
          success: ratesData.success,
          pricingCount: ratesData.pricing?.length || 0,
          error: ratesData.error || ratesData.message
        });
      }

      let pricingList: any[] = (ratesData.success && Array.isArray(ratesData.pricing)) ? [...ratesData.pricing] : [];

      // Filter or mark courier availability strictly based on Biteship API response
      pricingList = pricingList.map((p: any) => ({
        ...p,
        is_available: typeof p.price === "number" && p.price > 0 && p.available_for_instant_waybill_id !== false,
      }));

      return NextResponse.json({
        success: ratesData.success ?? true,
        pricing: pricingList,
        ...(ratesData.error ? { warning: ratesData.error } : {})
      });
    } catch (e: any) {
      console.warn("Rates API call error:", e);
      return NextResponse.json({
        success: false,
        error: `Biteship API Error: ${e.message || "Gagal menghubungi server Biteship"}`,
        pricing: []
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("BiteShip rates proxy error:", error);
    return NextResponse.json({
      success: false,
      error: `Error Internal Proxy Biteship: ${error.message}`,
      pricing: []
    }, { status: 500 });
  }
}
