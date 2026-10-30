import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { CLUSTERS, PAGE_SPECS } from "./seed-specs";
import { assemblePages } from "@/lib/assemble";
import type { PageSpec } from "@/lib/content";
import type { Cluster, Page } from "@/schemas/page";

export interface PageRepo {
  getPage(cluster: string, slug: string): Promise<Page | null>;
  listPages(opts?: { cluster?: string; limit?: number; offset?: number }): Promise<Page[]>;
  countPages(): Promise<number>;
  listClusters(): Promise<Cluster[]>;
  related(page: Page, limit?: number): Promise<Page[]>;
}

const indexable = (p: Page) => p.status === "published" || p.status === "noindex";

/** Pages released by the content pipeline (`npm run pipeline -- publish`). */
function publishedSpecs(): PageSpec[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/published-specs.json"), "utf8"));
  } catch {
    return [];
  }
}

// Without DATABASE_URL the site serves the in-repo seed plus pipeline output, so it runs anywhere.
function seedRepo(): PageRepo {
  const pages = assemblePages([...PAGE_SPECS, ...publishedSpecs()], "2026-10-27T00:00:00.000Z")
    .filter(indexable)
    .sort((a, b) => b.searchVolume - a.searchVolume);
  return {
    getPage: async (cluster, slug) => pages.find((p) => p.cluster === cluster && p.slug === slug) ?? null,
    listPages: async ({ cluster, limit = 50_000, offset = 0 } = {}) =>
      pages.filter((p) => !cluster || p.cluster === cluster).slice(offset, offset + limit),
    countPages: async () => pages.length,
    listClusters: async () => CLUSTERS,
    related: async (page, limit = 4) => pages.filter((p) => p.cluster === page.cluster && p.slug !== page.slug).slice(0, limit),
  };
}

function pgRepo(url: string): PageRepo {
  const db = drizzle(postgres(url, { max: 5 }), { schema });
  const { pages, keywordClusters: clusters, pageLinks } = schema;
  const live = inArray(pages.status, ["published", "noindex"]);

  const select = () =>
    db.select({ page: pages, cluster: clusters.slug }).from(pages).innerJoin(clusters, eq(pages.clusterId, clusters.id));

  const toPage = ({ page: r, cluster }: { page: typeof pages.$inferSelect; cluster: string }): Page => ({
    slug: r.slug,
    cluster,
    engine: r.engineKey,
    primaryKeyword: r.primaryKeyword,
    secondaryKeywords: r.secondaryKeywords,
    searchVolume: r.searchVolume,
    params: r.engineParams as Page["params"],
    ui: r.uiConfig as Page["ui"],
    content: r.content as Page["content"],
    seo: r.seo as Page["seo"],
    status: r.status,
    qualityScore: r.qualityScore,
    updatedAt: r.updatedAt.toISOString(),
  });

  return {
    async getPage(cluster, slug) {
      const [row] = await select().where(and(eq(pages.slug, slug), eq(clusters.slug, cluster), live)).limit(1);
      return row ? toPage(row) : null;
    },
    async listPages({ cluster, limit = 50_000, offset = 0 } = {}) {
      const rows = await select()
        .where(cluster ? and(live, eq(clusters.slug, cluster)) : live)
        .orderBy(desc(pages.searchVolume))
        .limit(limit)
        .offset(offset);
      return rows.map(toPage);
    },
    async countPages() {
      return db.$count(pages, live);
    },
    async listClusters() {
      const rows = await db.select().from(clusters);
      return rows.map((c) => ({ slug: c.slug, name: c.name, intent: c.intent, description: c.description }));
    },
    async related(page, limit = 4) {
      const [self] = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, page.slug));
      const linked = self
        ? await select().innerJoin(pageLinks, eq(pageLinks.toPageId, pages.id)).where(and(eq(pageLinks.fromPageId, self.id), live)).limit(limit)
        : [];
      if (linked.length) return linked.map(toPage);
      const rows = await select().where(and(eq(clusters.slug, page.cluster), ne(pages.slug, page.slug), live)).limit(limit);
      return rows.map(toPage);
    },
  };
}

let repo: PageRepo | undefined;
export function getRepo(): PageRepo {
  return (repo ??= process.env.DATABASE_URL ? pgRepo(process.env.DATABASE_URL) : seedRepo());
}

/** Request-deduped lookup shared by generateMetadata and the page component. */
export const getPage = cache((cluster: string, slug: string) => getRepo().getPage(cluster, slug));
