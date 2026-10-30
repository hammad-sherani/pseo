import { getRepo } from "@/db/queries";
import { INDEX_THRESHOLD } from "@/lib/quality";
import { SITE_URL, pagePath } from "@/seo";

const SITEMAP_SIZE = 45_000;
export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const match = /^(\d+)\.xml$/.exec((await params).file);
  if (!match) return new Response("Not found", { status: 404 });
  const n = Number(match[1]);

  const repo = getRepo();
  const pages = (await repo.listPages({ limit: SITEMAP_SIZE, offset: n * SITEMAP_SIZE }))
    // Only indexable pages belong in a sitemap.
    .filter((p) => p.status === "published" && p.qualityScore >= INDEX_THRESHOLD);
  const hubs = n === 0 ? ["", ...(await repo.listClusters()).map((c) => `/${c.slug}`)] : [];

  const urls = [
    ...hubs.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`),
    ...pages.map((p) => `  <url><loc>${SITE_URL}${pagePath(p)}</loc><lastmod>${p.updatedAt}</lastmod></url>`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
