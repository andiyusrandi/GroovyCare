import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const platformParam = url.searchParams.get("platform");
  const userAgent = request.headers.get("user-agent") || "";
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  const response = NextResponse.next();

  if (platformParam === "android") {
    // Set cookie jika parameter platform=android terdeteksi
    response.cookies.set("platform", "android", {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  } else if (!isMobileUA && !platformParam) {
    // Hapus cookie jika diakses dari desktop tanpa parameter platform
    if (request.cookies.has("platform")) {
      response.cookies.delete("platform");
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware hanya pada rute halaman, kecualikan:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo, assets (static assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
