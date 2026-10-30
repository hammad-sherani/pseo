import type { PageSpec } from "../../src/lib/content";
import type { PipelineSpec, PipelineState } from "./types";

/**
 * Drip publishing: releases at most `perDay` generated pages per UTC day,
 * highest search volume first. Safe to run as often as you like (e.g. hourly
 * cron); the quota counts pages already published today.
 */
export function releaseBatch(state: PipelineState, perDay: number, now = new Date()): PipelineSpec[] {
  const today = now.toISOString().slice(0, 10);
  const doneToday = state.specs.filter((s) => s.publishedAt?.startsWith(today)).length;
  const batch = state.specs
    .filter((s) => s.status === "generated")
    .sort((a, b) => b.volume - a.volume)
    .slice(0, Math.max(0, perDay - doneToday));
  for (const s of batch) Object.assign(s, { status: "published", publishedAt: now.toISOString() });
  return batch;
}

/**
 * Published pages as plain PageSpecs, in publish order. Order matters: UI
 * variants are assigned in sequence, so appending keeps existing pages' layouts
 * stable when new pages arrive.
 */
export function publishedSpecs(state: PipelineState): PageSpec[] {
  return state.specs
    .filter((s) => s.status === "published")
    .sort((a, b) => a.publishedAt!.localeCompare(b.publishedAt!) || a.slug.localeCompare(b.slug))
    .map(({ slug, cluster, engine, keyword, secondary, volume, params, primaryOutput, editorial }) => ({
      slug, cluster, engine, keyword, secondary, volume, params, primaryOutput, editorial,
    }));
}

/** Asks the running site to rebuild the given paths (ISR on-demand revalidation). */
export async function revalidate(paths: string[], siteUrl: string, secret: string) {
  const res = await fetch(`${siteUrl.replace(/\/$/, "")}/api/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-revalidate-secret": secret },
    body: JSON.stringify({ paths }),
  });
  if (!res.ok) throw new Error(`Revalidation failed: HTTP ${res.status}`);
}
