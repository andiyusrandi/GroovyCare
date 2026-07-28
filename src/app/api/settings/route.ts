import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const prisma = db as any;
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc: Record<string, string>, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    
    // Default fallback jika data kosong
    if (!settingsMap.logo_url) {
      settingsMap.logo_url = "https://res.cloudinary.com/rumahhostcom/image/upload/v1785256133/IMG_20260725_184829_670_odzsui.png";
    }
    if (!settingsMap.app_name) {
      settingsMap.app_name = "GroovyCare";
    }

    return NextResponse.json({ success: true, settings: settingsMap });
  } catch (error: any) {
    console.error("Fetch settings API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        settings: {
          logo_url: "https://res.cloudinary.com/rumahhostcom/image/upload/v1785256133/IMG_20260725_184829_670_odzsui.png",
          app_name: "GroovyCare"
        }
      }
    );
  }
}
