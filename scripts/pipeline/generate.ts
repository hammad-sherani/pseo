import * as z from "zod/v4";
import { getEngine } from "../../src/engines";
import type { Table } from "../../src/engines/types";
import { buildContent, type PageSpec } from "../../src/lib/content";
import { DUPLICATE_THRESHOLD, INDEX_THRESHOLD, qualityScore, similarity } from "../../src/lib/quality";
import type { Content } from "../../src/schemas/page";
import { pool, type LlmClient } from "./llm";
import type { PipelineSpec, PipelineState } from "./types";

export const Editorial = z.object({
  intro: z.string().describe("2–3 sentences, 40–80 words. Says who the tool is for and what it answers. No hype."),
  howTo: z.array(z.string()).describe("3–5 imperative steps for this tool's actual inputs, in order."),
  faq: z
    .array(z.object({ q: z.string(), a: z.string().describe("2–4 sentences, direct answer first.") }))
    .describe("3–5 questions a person searching this exact keyword would ask next."),
});
export type Editorial = z.infer<typeof Editorial>;

export const GENERATE_SYSTEM = `You write the copy around free online tools (calculators, converters, text counters) on a programmatic SEO site. Each page already has a working tool and engine-computed worked examples; your copy explains the tool for the searcher of one specific keyword.

What makes copy good here:
- Specific to the keyword's searcher. A boat loan page talks about boat buyers' situations; an Instagram caption counter talks about captions, hashtags and the "more" cut-off. If a sentence could appear unchanged on a sibling page, rewrite it.
- Useful: answer the questions that come right after using the tool (what affects the result, common mistakes, what the number means in practice).
- Plain, confident, concise. No "In today's world", no "Look no further", no exclamation marks, no claims about being the best.

Hard rules (copy that breaks them is rejected automatically):
- Numbers: use only figures that appear in the FACTS block. Do not introduce rates, limits, prices, statistics, dates or years from memory. Small counts (1–10) are fine. Write a qualitative statement instead of a number when no figure is given.
- Do not describe features the tool does not have. Its inputs and outputs are listed in FACTS.
- No URLs, no brand comparisons, no medical, legal or tax advice beyond general information.
- Don't restate the sibling intros listed under AVOID; take a different angle.`;

/** Everything the copy may rely on, computed by the engine rather than recalled by the model. */
export function factsFor(spec: PageSpec) {
  const engine = getEngine(spec.engine);
  const { sample: _sample, chartValues: _chart, ...params } = spec.params as Record<string, unknown>;
  const defaults = engine.defaults(spec.params);
  const result = engine.run(defaults, spec.params);
  const outputs = engine.outputs(spec.params);
  const template = buildContent({ ...spec, editorial: undefined });
  const defaultResult = Object.fromEntries(
    outputs.filter((o) => o.kind === "number" || o.kind === "text").map((o) => [o.label, result[o.key]]),
  );
  const firstTable = outputs.find((o) => o.kind === "table");
  return {
    keyword: spec.keyword,
    alsoSearchedAs: spec.secondary,
    tool: {
      inputs: engine.inputs(spec.params).map((f) => ({ label: f.label, unit: f.unit, options: f.options?.map((o) => o.label) })),
      outputs: outputs.map((o) => o.label),
    },
    presets: params,
    defaultInputs: spec.engine === "text" ? "sample paragraph" : defaults,
    defaultResult,
    ...(firstTable ? { [firstTable.label]: (result[firstTable.key] as Table).rows.slice(0, 8) } : {}),
    formula: template.formula,
    workedExamples: template.examples,
  };
}

const normNum = (n: string) => String(Number(n.replace(/,/g, "")));
const NUM = /\d[\d,]*(?:\.\d+)?/g;

/** Figures in the copy that the facts don't contain (small integers are always allowed). */
export function unsupportedNumbers(ed: Editorial, facts: unknown): string[] {
  const allowed = new Set((JSON.stringify(facts).match(NUM) ?? []).map(normNum));
  const text = [ed.intro, ...ed.howTo, ...ed.faq.flatMap((f) => [f.q, f.a])].join(" ");
  const found = new Set((text.match(NUM) ?? []).map(normNum));
  return [...found].filter((n) => !allowed.has(n) && !(Number.isInteger(Number(n)) && Number(n) <= 10));
}

export interface Verdict {
  ok: boolean;
  problems: string[];
  score: number;
  maxSimilarity: number;
}

/** Applies the same quality gate the site uses, plus the number guard. */
export function review(spec: PageSpec, ed: Editorial, siblings: PageSpec[]): Verdict {
  const problems: string[] = [];
  if (ed.howTo.length < 3) problems.push("Give at least 3 how-to steps.");
  if (ed.faq.length < 3) problems.push("Give at least 3 FAQs.");
  if (ed.intro.split(/\s+/).length < 25) problems.push("The intro is too short; write 40–80 words.");
  const bad = unsupportedNumbers(ed, factsFor(spec));
  if (bad.length) problems.push(`These figures are not in FACTS, remove or replace them: ${bad.join(", ")}.`);

  const content = buildContent({ ...spec, editorial: ed });
  // Engine-made worked examples differ page to page and dilute overlap, so the
  // duplicate check compares the written copy only.
  const copyOnly = (c: Content) => ({ ...c, examples: [] });
  const worst = siblings
    .map((s) => {
      const other = buildContent(s);
      return { slug: s.slug, full: similarity(content, other), copy: similarity(copyOnly(content), copyOnly(other)) };
    })
    .reduce((a, b) => (b.copy > a.copy ? b : a), { slug: "", full: 0, copy: 0 });
  const score = qualityScore(content, worst.full);
  if (worst.copy >= DUPLICATE_THRESHOLD) {
    problems.push(`Too similar to the sibling page "${worst.slug}" (${Math.round(worst.copy * 100)}% phrase overlap). Use different wording and angles.`);
  } else if (score < INDEX_THRESHOLD) {
    problems.push(`Quality score ${score} is below ${INDEX_THRESHOLD}: write a fuller intro and more specific FAQs.`);
  }
  return { ok: problems.length === 0, problems, score, maxSimilarity: worst.copy };
}

function userPrompt(spec: PageSpec, siblings: PageSpec[], feedback: string[]): string {
  const avoid = siblings.slice(0, 12).map((s) => `- ${s.keyword}: ${buildContent(s).intro}`).join("\n");
  return [
    `Write the copy for the page targeting "${spec.keyword}".`,
    `<facts>\n${JSON.stringify(factsFor(spec), null, 2)}\n</facts>`,
    avoid && `<avoid>\nSibling pages in the same section already use these intros:\n${avoid}\n</avoid>`,
    feedback.length && `<previous_attempt_rejected>\n${feedback.map((f) => `- ${f}`).join("\n")}\n</previous_attempt_rejected>`,
  ].filter(Boolean).join("\n\n");
}

export interface GenerateOptions {
  limit?: number;
  concurrency?: number;
  maxAttempts?: number;
  /** Specs already live on the site (seed pages) that new copy must not duplicate. */
  existing: PageSpec[];
  /** Called after each spec finishes, so progress survives a crash. */
  onProgress?: (spec: PipelineSpec, verdict: Verdict | null) => void | Promise<void>;
}

export async function generate(state: PipelineState, llm: LlmClient, opts: GenerateOptions) {
  const queue = state.specs
    .filter((s) => s.status === "approved" || s.status === "failed")
    .sort((a, b) => b.volume - a.volume)
    .slice(0, opts.limit ?? Infinity);

  // Siblings are read at the time each page is reviewed, so pages finished
  // earlier in the run count toward the duplicate check of later ones.
  const siblingsOf = (spec: PipelineSpec): PageSpec[] => [
    ...opts.existing.filter((s) => s.cluster === spec.cluster),
    ...state.specs.filter((s) => s !== spec && s.cluster === spec.cluster && s.editorial && (s.status === "generated" || s.status === "published")),
  ];

  await pool(queue, opts.concurrency ?? 4, async (spec) => {
    let feedback: string[] = [];
    let verdict: Verdict | null = null;
    try {
      for (let attempt = 1; attempt <= (opts.maxAttempts ?? 2); attempt++) {
        const ed = await llm.json({ system: GENERATE_SYSTEM, user: userPrompt(spec, siblingsOf(spec), feedback), schema: Editorial });
        verdict = review(spec, ed, siblingsOf(spec));
        if (verdict.ok) {
          Object.assign(spec, { editorial: ed, status: "generated", generatedAt: new Date().toISOString() });
          delete spec.error;
          break;
        }
        feedback = verdict.problems;
      }
      if (spec.status !== "generated") Object.assign(spec, { status: "failed", error: feedback.join(" ") });
    } catch (err) {
      Object.assign(spec, { status: "failed", error: err instanceof Error ? err.message : String(err) });
    }
    await opts.onProgress?.(spec, verdict);
  });
  return queue;
}
