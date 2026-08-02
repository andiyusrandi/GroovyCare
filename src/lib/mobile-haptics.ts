"use client";

export async function triggerHapticImpact() {
  try {
    if (typeof window !== "undefined" && (window as any).Capacitor) {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch (e) {
    // Graceful fallback for standard Web browser
  }
}

export async function triggerHapticNotification() {
  try {
    if (typeof window !== "undefined" && (window as any).Capacitor) {
      const { Haptics, NotificationType } = await import("@capacitor/haptics");
      await Haptics.notification({ type: NotificationType.Success });
    } else if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
  } catch (e) {
    // Graceful fallback for standard Web browser
  }
}
