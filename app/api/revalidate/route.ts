import { revalidatePath } from "next/cache";

/**
 * Called by the publish pipeline after it writes page rows:
 * POST /api/revalidate  { "paths": ["/finance/auto-loan-calculator"] }
 * with header  x-revalidate-secret: $REVALIDATE_SECRET
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const { paths } = (await req.json()) as { paths?: string[] };
  const valid = (paths ?? []).filter((p) => typeof p === "string" && p.startsWith("/"));
  for (const p of valid) revalidatePath(p);
  if (valid.length) revalidatePath("/sitemap.xml");
  return Response.json({ ok: true, revalidated: valid });
}
