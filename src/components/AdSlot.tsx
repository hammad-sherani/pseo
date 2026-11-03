"use client";

import { useEffect } from "react";
import { ADSENSE_CLIENT, ADS_ENABLED, AD_SLOTS, type AdPosition } from "@/ads/config";

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

/** One AdSense unit. Renders nothing until ads are switched on (see src/ads/config.ts). */
export function AdSlot({ position }: { position: AdPosition }) {
  const slot = AD_SLOTS[position];
  const on = ADS_ENABLED && Boolean(slot);

  useEffect(() => {
    if (!on) return;
    try {
      (window.adsbygoogle ||= []).push({});
    } catch {
      // Blocked or not yet loaded: the reserved space just stays empty.
    }
  }, [on]);

  if (!on) return null;
  return (
    <aside className={`ad ad-${position}`} aria-label="Advertisement">
      <span className="ad-label">Advertisement</span>
      <ins
        className="adsbygoogle"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={position === "rail" ? "vertical" : "auto"}
        data-full-width-responsive={position === "rail" ? "false" : "true"}
      />
    </aside>
  );
}
