import type { PageSpec } from "../../src/lib/content";

export interface KeywordRow {
  keyword: string;
  volume: number;
  kd?: number;
}

/**
 * Lifecycle of a page in the pipeline:
 *   rule-mapped ──► approved ─┐
 *   llm-mapped  ──► needs_review ──(approve)──► approved ──(generate)──► generated ──(publish)──► published
 *                                └──(reject)──► rejected            └──► failed (retry with generate)
 */
export type SpecStatus = "needs_review" | "approved" | "generated" | "failed" | "published" | "rejected";

export interface PipelineSpec extends PageSpec {
  status: SpecStatus;
  /** Engine + params identity; keywords with the same signature share one page. */
  signature: string;
  mappedBy: "rule" | "llm";
  mapReason?: string;
  generatedAt?: string;
  publishedAt?: string;
  error?: string;
}

export interface Unmapped {
  keyword: string;
  volume: number;
  reason: string;
}

export interface PipelineState {
  version: 1;
  keywords: KeywordRow[];
  /** Keywords already served by an existing page, recorded so re-runs skip them. */
  covered: { keyword: string; slug: string }[];
  unmapped: Unmapped[];
  specs: PipelineSpec[];
}
