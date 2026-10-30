// Upserts assembled pages (and the registry rows they reference) into Postgres.
// Shared by the seed script and the pipeline's publish step.
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { CLUSTERS } from "../src/db/seed-specs";
import { ENGINES } from "../src/engines";
import { THEMES } from "../src/theme/themes";
import { TOOL_LAYOUTS, type Page } from "../src/schemas/page";
import type { PageSpec } from "../src/lib/content";

export async function writePages(url: string, pages: Page[], specs: PageSpec[]) {
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });
  try {
    // Engine field definitions depend on params, so record them as seen with the
    // first page that uses each engine.
    for (const [key, engine] of Object.entries(ENGINES)) {
      const params = specs.find((s) => s.engine === key)?.params ?? {};
      const row = { key, inputSchema: engine.inputs(params), outputSchema: engine.outputs(params) };
      await db.insert(schema.toolEngines).values(row)
        .onConflictDoUpdate({ target: schema.toolEngines.key, set: { inputSchema: row.inputSchema, outputSchema: row.outputSchema } });
    }
    for (const key of TOOL_LAYOUTS) {
      await db.insert(schema.layouts).values({ key, slots: ["inputs", "outputs"] }).onConflictDoNothing();
    }
    for (const [key, tokens] of Object.entries(THEMES)) {
      await db.insert(schema.themes).values({ key, tokens }).onConflictDoUpdate({ target: schema.themes.key, set: { tokens } });
    }
    const clusterIds = new Map<string, number>();
    for (const c of CLUSTERS) {
      const [row] = await db.insert(schema.keywordClusters).values(c)
        .onConflictDoUpdate({ target: schema.keywordClusters.slug, set: { name: c.name, description: c.description } })
        .returning({ id: schema.keywordClusters.id });
      clusterIds.set(c.slug, row.id);
    }

    for (const p of pages) {
      const values = {
        slug: p.slug,
        clusterId: clusterIds.get(p.cluster)!,
        engineKey: p.engine,
        primaryKeyword: p.primaryKeyword,
        secondaryKeywords: p.secondaryKeywords,
        searchVolume: p.searchVolume,
        engineParams: p.params,
        uiConfig: p.ui,
        content: p.content,
        seo: p.seo,
        status: p.status,
        qualityScore: p.qualityScore,
        publishedAt: p.status === "published" ? new Date() : null,
        updatedAt: new Date(p.updatedAt),
      };
      await db.insert(schema.pages).values(values).onConflictDoUpdate({ target: schema.pages.slug, set: values });
    }
  } finally {
    await client.end();
  }
}
