import type { Content } from "@/schemas/page";

const textOf = (c: Content) =>
  [c.intro, ...c.howTo, ...c.faq.flatMap((f) => [f.q, f.a]), ...c.examples.flatMap((e) => [e.title, e.detail])].join(" ");

function shingles(s: string, n = 4): Set<string> {
  const words = s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(" "));
  return out;
}

/** Jaccard similarity of 4-word shingles; near-duplicate copy scores high. */
export function similarity(a: Content, b: Content): number {
  const A = shingles(textOf(a));
  const B = shingles(textOf(b));
  let inter = 0;
  for (const s of A) if (B.has(s)) inter++;
  return inter / (A.size + B.size - inter || 1);
}

export const DUPLICATE_THRESHOLD = 0.5;
export const INDEX_THRESHOLD = 60;

/** 0–100 score; pages under INDEX_THRESHOLD ship as noindex. */
export function qualityScore(c: Content, maxSiblingSimilarity: number): number {
  const words = textOf(c).split(/\s+/).length;
  let score = 0;
  score += Math.min(30, words / 10);
  score += Math.min(20, c.faq.length * 5);
  score += Math.min(20, c.examples.length * 7);
  score += c.formula ? 10 : 0;
  score += Math.round(20 * (1 - Math.min(1, maxSiblingSimilarity / DUPLICATE_THRESHOLD)));
  // A near-duplicate is never indexable, however rich the page is otherwise.
  if (maxSiblingSimilarity >= DUPLICATE_THRESHOLD) score = Math.min(score, INDEX_THRESHOLD - 1);
  return Math.round(Math.min(100, score));
}
