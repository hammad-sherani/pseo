import { getEngine } from "@/engines";
import { buildContent, buildSeo, type PageSpec } from "@/lib/content";
import { INDEX_THRESHOLD, qualityScore, similarity } from "@/lib/quality";
import { buildUiConfig } from "@/lib/variant";
import { Page, type Content } from "@/schemas/page";

/**
 * Pipeline steps 3–5 in one pass: content → UI variant → quality gate.
 * Output is validated against the Page schema, so a bad row never ships.
 */
export function assemblePages(specs: PageSpec[], updatedAt = new Date().toISOString()): Page[] {
  const takenByCluster = new Map<string, Set<string>>();
  const contents = new Map<string, Content>(specs.map((s) => [s.slug, buildContent(s)]));

  return specs.map((spec) => {
    const engine = getEngine(spec.engine);
    const taken = takenByCluster.get(spec.cluster) ?? new Set<string>();
    takenByCluster.set(spec.cluster, taken);

    const content = contents.get(spec.slug)!;
    const siblings = specs.filter((s) => s.cluster === spec.cluster && s.slug !== spec.slug);
    const maxSim = Math.max(0, ...siblings.map((s) => similarity(content, contents.get(s.slug)!)));
    const score = qualityScore(content, maxSim);

    return Page.parse({
      slug: spec.slug,
      cluster: spec.cluster,
      engine: spec.engine,
      primaryKeyword: spec.keyword,
      secondaryKeywords: spec.secondary,
      searchVolume: spec.volume,
      params: spec.params,
      ui: buildUiConfig({ slug: spec.slug, engine, params: spec.params, primaryOutput: spec.primaryOutput, taken }),
      content,
      seo: buildSeo(spec, content),
      status: score >= INDEX_THRESHOLD ? "published" : "noindex",
      qualityScore: score,
      updatedAt,
    });
  });
}
