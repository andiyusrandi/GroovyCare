import { useEffect, useState } from "react";

export function useMobileBrowser() {
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Bypass blokir browser mobile saat masa development/testing
    if (process.env.NODE_ENV === "development") {
      setIsMobileBrowser(false);
      return;
    }

    // 1. Deteksi perangkat mobile/tablet lewat User Agent atau lebar layar
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || window.innerWidth < 768;

    // 2. Deteksi apakah dijalankan di dalam aplikasi native WebView Capacitor
    const isNativeApp = !!(window as any).Capacitor
      || (window.location.hostname === "localhost" && !window.location.port)
      || navigator.userAgent.toLowerCase().includes("capacitor")
      || window.location.search.includes("platform=android")
      || document.cookie.includes("platform=android");

    setIsMobileBrowser(isMobileDevice && !isNativeApp);
  }, []);

  return isMobileBrowser;
}
