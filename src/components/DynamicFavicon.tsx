"use client";

import { useEffect } from "react";

export default function DynamicFavicon() {
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const faviconUrl = data?.success && data.settings?.favicon_url ? data.settings.favicon_url : "/favicon/favicon.ico";
        const links = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
        if (links.length > 0) {
          links.forEach((link) => {
            link.href = faviconUrl;
          });
        } else {
          const link = document.createElement("link");
          link.rel = "icon";
          link.href = faviconUrl;
          document.head.appendChild(link);
        }
      })
      .catch((err) => console.error("Error updating dynamic favicon:", err));
  }, []);

  return null;
}
