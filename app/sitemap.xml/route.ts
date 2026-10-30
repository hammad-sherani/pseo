import { getRepo } from "@/db/queries";
import { SITE_URL } from "@/seo";

const SITEMAP_SIZE = 45_000;
export const revalidate = 3600;

/** Sitemap index: one child sitemap per 45k URLs (the protocol limit is 50k). */
export async function GET() {
  const count = await getRepo().countPages();
  const files = Math.max(1, Math.ceil(count / SITEMAP_SIZE));
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: files }, (_, i) => `  <sitemap><loc>${SITE_URL}/sitemaps/${i}.xml</loc></sitemap>`).join("\n")}
</sitemapindex>`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
