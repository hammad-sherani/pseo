import { ADS_ENABLED, adsensePublisherId } from "@/ads/config";

// AdSense checks /ads.txt before serving; it only exists once ads are switched on.
export function GET() {
  if (!ADS_ENABLED) return new Response("Not found", { status: 404 });
  return new Response(`google.com, ${adsensePublisherId()}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
