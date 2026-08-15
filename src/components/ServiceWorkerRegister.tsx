"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js?v=2")
          .then((reg) => {
            console.log("[Service Worker] Registered successfully with scope:", reg.scope);
            // Force immediate update check to replace old cached offline page
            reg.update();
          })
          .catch((err) => {
            console.warn("[Service Worker] Registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}
