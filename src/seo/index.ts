import type { Metadata } from "next";
import type { Cluster, Page } from "@/schemas/page";
import { INDEX_THRESHOLD } from "@/lib/quality";

export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "Toolhaus";
/** Public contact address shown on /contact; unset hides the email link. */
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL?.trim() ?? "";

export const pagePath = (p: Pick<Page, "cluster" | "slug">) => `/${p.cluster}/${p.slug}`;

export function pageMetadata(page: Page): Metadata {
  const url = `${SITE_URL}${pagePath(page)}`;
  const indexable = page.status === "published" && page.qualityScore >= INDEX_THRESHOLD;
  return {
    title: page.seo.title,
    description: page.seo.description,
    keywords: [page.primaryKeyword, ...page.secondaryKeywords],
    alternates: { canonical: url },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: page.seo.title,
      description: page.seo.description,
      images: [{ url: `${SITE_URL}/og/${page.cluster}/${page.slug}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

/** JSON-LD graph built from the same content JSON the page renders. */
export function pageJsonLd(page: Page, cluster: Cluster) {
  const url = `${SITE_URL}${pagePath(page)}`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": page.seo.schemaType,
      "@id": `${url}#app`,
      name: page.content.h1,
      url,
      description: page.seo.description,
      applicationCategory: page.seo.applicationCategory,
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript for live updates",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "FAQPage",
      mainEntity: page.content.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: cluster.name, item: `${SITE_URL}/${cluster.slug}` },
        { "@type": "ListItem", position: 3, name: page.content.h1, item: url },
      ],
    },
  ];
  return { "@context": "https://schema.org", "@graph": graph };
}

/** Serialize for a <script> tag without allowing "</script>" breakouts. */
export const jsonLdScript = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
