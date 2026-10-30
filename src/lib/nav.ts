// Site navigation data for the app shell (sidebar + search). Built on the
// server from the repo; client components only import the types.
import { getRepo } from "@/db/queries";
import { pagePath } from "@/seo";
import type { Cluster, Page } from "@/schemas/page";

export interface NavTool {
  title: string;
  /** Sidebar label: the title without the trailing "Calculator"/"Converter (x to y)". */
  short: string;
  href: string;
}

export interface NavGroup {
  slug: string;
  name: string;
  intent: Cluster["intent"];
  count: number;
  tools: NavTool[];
}

export interface SearchItem {
  title: string;
  href: string;
  group: string;
  intent: Cluster["intent"];
  keywords: string;
}

const SIDEBAR_TOOLS = 6;
// The palette ships its index in the HTML, so cap it; hubs list everything.
const SEARCH_LIMIT = 400;

const shortTitle = (h1: string) => h1.replace(/\s+(Calculator|Converter)\b.*$/, "") || h1;
const toNavTool = (p: Page): NavTool => ({ title: p.content.h1, short: shortTitle(p.content.h1), href: pagePath(p) });

export async function siteNav() {
  const repo = getRepo();
  const clusters = await repo.listClusters();
  const byCluster = await Promise.all(clusters.map((c) => repo.listPages({ cluster: c.slug })));

  const groups: NavGroup[] = clusters.map((c, i) => ({
    slug: c.slug, name: c.name, intent: c.intent, count: byCluster[i].length,
    tools: byCluster[i].slice(0, SIDEBAR_TOOLS).map(toNavTool),
  }));

  const search: SearchItem[] = byCluster
    .flatMap((pages, i) => pages.map((p) => ({ p, c: clusters[i] })))
    .sort((a, b) => b.p.searchVolume - a.p.searchVolume)
    .slice(0, SEARCH_LIMIT)
    .map(({ p, c }) => ({
      title: p.content.h1, href: pagePath(p), group: c.name, intent: c.intent,
      keywords: [p.primaryKeyword, ...p.secondaryKeywords].join(" "),
    }));

  return { groups, search, total: byCluster.reduce((n, ps) => n + ps.length, 0) };
}
