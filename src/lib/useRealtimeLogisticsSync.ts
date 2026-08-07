"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function useRealtimeLogisticsSync(orders: any[] = [], intervalMs: number = 10000) {
  const router = useRouter();
  const isRefreshingRef = useRef(false);

  // Check if any order is currently in active shipping/delivery status
  const hasActiveLogistics = orders.some((o: any) => {
    const status = (o.status || "").toUpperCase();
    const biteshipStatus = (o.biteshipStatus || "").toLowerCase();
    
    const isActiveStatus = status === "PENDING_SHIPPING" || status === "SHIPPED";
    const isNotFinalBiteship = biteshipStatus !== "delivered" && biteshipStatus !== "cancelled" && biteshipStatus !== "rejected";
    
    return isActiveStatus || (!!o.biteshipOrderId && isNotFinalBiteship);
  });

  useEffect(() => {
    if (!hasActiveLogistics) return;

    const timer = setInterval(() => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;

      try {
        router.refresh();
      } catch (err) {
        console.warn("Silent logistics sync error:", err);
      } finally {
        setTimeout(() => {
          isRefreshingRef.current = false;
        }, 1500);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [hasActiveLogistics, router, intervalMs]);

  return { hasActiveLogistics };
}
