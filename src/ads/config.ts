/**
 * AdSense switch. Everything ad-related (slots, script, ads.txt, the privacy
 * policy's advertising text) stays off until NEXT_PUBLIC_ADSENSE_CLIENT is set.
 * NEXT_PUBLIC_ values are inlined at build time, so redeploy after changing them.
 */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";
export const ADS_ENABLED = /^ca-pub-\d+$/.test(ADSENSE_CLIENT);

export type AdPosition = "belowTool" | "inContent" | "rail" | "end";

// Each position is a separate ad unit in AdSense; an empty id hides that slot.
export const AD_SLOTS: Record<AdPosition, string> = {
  belowTool: process.env.NEXT_PUBLIC_AD_SLOT_BELOW_TOOL?.trim() ?? "",
  inContent: process.env.NEXT_PUBLIC_AD_SLOT_IN_CONTENT?.trim() ?? "",
  rail: process.env.NEXT_PUBLIC_AD_SLOT_RAIL?.trim() ?? "",
  end: process.env.NEXT_PUBLIC_AD_SLOT_END?.trim() ?? "",
};

/** "ca-pub-123" → "pub-123", the form ads.txt expects. */
export const adsensePublisherId = () => ADSENSE_CLIENT.replace(/^ca-/, "");
