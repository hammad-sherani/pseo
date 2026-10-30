import { ImageResponse } from "next/og";
import { getPage } from "@/db/queries";
import { THEMES } from "@/theme/themes";
import { SITE_NAME } from "@/seo";

export const revalidate = 86400;

export async function GET(_req: Request, { params }: { params: Promise<{ cluster: string; slug: string }> }) {
  const { cluster, slug } = await params;
  const page = await getPage(cluster, slug);
  if (!page) return new Response("Not found", { status: 404 });
  const accent = (THEMES[page.ui.theme] ?? THEMES.ocean).accent[0];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#fbfaf8", borderTop: `24px solid ${accent}` }}>
        <div style={{ fontSize: 30, color: accent, fontWeight: 700 }}>{SITE_NAME}</div>
        <div style={{ fontSize: 76, fontWeight: 800, color: "#1b1d21", lineHeight: 1.1 }}>{page.content.h1}</div>
        <div style={{ fontSize: 30, color: "#5b6170" }}>Free · Instant · Shows the formula</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
