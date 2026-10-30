import * as z from "zod/v4";
import type { LoanParams } from "../../src/engines/loan";
import { UNIT_CATEGORIES, type UnitParams } from "../../src/engines/units";
import type { TextParams } from "../../src/engines/text";
import type { PageSpec } from "../../src/lib/content";
import { SAMPLE_TEXT } from "../../src/db/seed-specs";
import type { LlmClient } from "./llm";
import type { KeywordRow, PipelineSpec, PipelineState, Unmapped } from "./types";

export const ENGINE_CLUSTER: Record<string, string> = { loan: "finance", units: "converters", text: "text" };

type Mapping = Pick<PageSpec, "engine" | "params" | "primaryOutput">;

// ── Signatures ──────────────────────────────────────────────────────────────
// Two keywords with the same signature want the same tool, so they become one
// page (primary + secondary keywords) instead of competing pages.

export function signatureOf(engine: string, params: Record<string, unknown>): string {
  if (engine === "loan") return `loan:${String(params.loanLabel).toLowerCase()}`;
  if (engine === "units") return `units:${params.from}:${params.to}`;
  if (engine === "text") return `text:${params.focus}:${params.limit ?? ""}:${String(params.context ?? "").toLowerCase()}`;
  throw new Error(`No signature for engine ${engine}`);
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[°']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

// ── Units ───────────────────────────────────────────────────────────────────

const UNIT_ALIASES: Record<string, [category: string, unit: string]> = {};
for (const [category, units] of Object.entries(UNIT_CATEGORIES)) {
  for (const u of units) {
    for (const alias of [u.key, u.name, u.symbol.toLowerCase(), u.name.replace(/s$/, "")]) UNIT_ALIASES[alias.toLowerCase()] = [category, u.key];
  }
}
Object.assign(UNIT_ALIASES, {
  kgs: ["mass", "kg"], kilo: ["mass", "kg"], kilos: ["mass", "kg"], lbs: ["mass", "lb"], pound: ["mass", "lb"],
  ounce: ["mass", "oz"], gram: ["mass", "g"], stones: ["mass", "st"],
  meter: ["length", "m"], metre: ["length", "m"], metres: ["length", "m"], centimeter: ["length", "cm"], centimetre: ["length", "cm"],
  centimetres: ["length", "cm"], kilometer: ["length", "km"], kilometre: ["length", "km"], kilometres: ["length", "km"],
  inch: ["length", "in"], foot: ["length", "ft"], feet: ["length", "ft"], mile: ["length", "mi"],
  celcius: ["temperature", "c"], centigrade: ["temperature", "c"], "°c": ["temperature", "c"], "°f": ["temperature", "f"],
  liter: ["volume", "l"], litre: ["volume", "l"], litres: ["volume", "l"], gallon: ["volume", "gal"], gallons: ["volume", "gal"],
  milliliter: ["volume", "ml"], millilitre: ["volume", "ml"], cups: ["volume", "cup"],
} satisfies Record<string, [string, string]>);

const CHART_VALUES: Record<string, number[]> = {
  c: [-40, -10, 0, 20, 25, 37, 100, 180],
  f: [-40, 0, 32, 50, 72, 98.6, 212, 350],
  k: [0, 233.15, 273.15, 293.15, 310.15, 373.15],
};

export function unitParams(category: string, from: string, to: string): UnitParams {
  const chartValues = CHART_VALUES[from] ?? [1, 2, 5, 10, 20, 50, 100, 1000];
  return { category: category as UnitParams["category"], from, to, defaultValue: chartValues[3], chartValues };
}

function mapUnits(keyword: string): Mapping | null {
  const k = keyword.replace(/\b(converter|conversion|calculator|chart|calc)\b/g, "").replace(/\s+/g, " ").trim();
  let from: string | undefined;
  let to: string | undefined;
  const howMany = /^how many (.+?) (?:are )?in (?:a |an |one |1 )?(.+?)$/.exec(k);
  const direct = /^(?:convert )?(?:[\d.]+ )?(.+?) (?:to|in|into) (.+?)$/.exec(k);
  if (howMany) [from, to] = [howMany[2], howMany[1]];
  else if (direct) [from, to] = [direct[1], direct[2]];
  const a = from && UNIT_ALIASES[from];
  const b = to && UNIT_ALIASES[to];
  if (!a || !b || a[0] !== b[0] || a[1] === b[1]) return null;
  return { engine: "units", params: { ...unitParams(a[0], a[1], b[1]) }, primaryOutput: "summary" };
}

// ── Loans ───────────────────────────────────────────────────────────────────
// Default rates/terms are editorial presets maintained here, not model output.

const LOAN_PRESETS: { aliases: string[]; params: LoanParams }[] = [
  { aliases: ["auto", "car", "vehicle"], params: { loanLabel: "Auto loan", defaultAmount: 35000, maxAmount: 150000, defaultRate: 7.1, defaultTermMonths: 60, termOptions: [36, 48, 60, 72, 84], showDownPayment: true } },
  { aliases: ["mortgage", "home", "house"], params: { loanLabel: "Mortgage", defaultAmount: 400000, maxAmount: 2000000, defaultRate: 6.5, defaultTermMonths: 360, termOptions: [120, 180, 240, 360], showDownPayment: true } },
  { aliases: ["personal"], params: { loanLabel: "Personal loan", defaultAmount: 15000, maxAmount: 100000, defaultRate: 11.5, defaultTermMonths: 36, termOptions: [12, 24, 36, 48, 60], showDownPayment: false } },
  { aliases: ["student", "college"], params: { loanLabel: "Student loan", defaultAmount: 30000, maxAmount: 200000, defaultRate: 5.5, defaultTermMonths: 120, termOptions: [60, 120, 180, 240, 300], showDownPayment: false } },
  { aliases: ["boat"], params: { loanLabel: "Boat loan", defaultAmount: 60000, maxAmount: 500000, defaultRate: 8.4, defaultTermMonths: 180, termOptions: [60, 120, 180, 240], showDownPayment: true } },
  { aliases: ["rv", "camper", "motorhome"], params: { loanLabel: "RV loan", defaultAmount: 80000, maxAmount: 500000, defaultRate: 8.2, defaultTermMonths: 180, termOptions: [60, 120, 180, 240], showDownPayment: true } },
  { aliases: ["motorcycle", "motorbike"], params: { loanLabel: "Motorcycle loan", defaultAmount: 12000, maxAmount: 60000, defaultRate: 9.5, defaultTermMonths: 48, termOptions: [24, 36, 48, 60, 72], showDownPayment: true } },
  { aliases: ["business", "sba"], params: { loanLabel: "Business loan", defaultAmount: 100000, maxAmount: 5000000, defaultRate: 9.0, defaultTermMonths: 60, termOptions: [12, 36, 60, 84, 120], showDownPayment: false } },
];

function mapLoan(keyword: string): Mapping | null {
  if (!/\b(calculator|calc|estimator)\b/.test(keyword) || !/\b(loan|payment|mortgage|financing)\b/.test(keyword)) return null;
  const words = new Set(keyword.split(" "));
  const preset = LOAN_PRESETS.find((p) => p.aliases.some((a) => words.has(a)));
  return preset ? { engine: "loan", params: { ...preset.params } } : null;
}

// ── Text ────────────────────────────────────────────────────────────────────

const PLATFORM_LIMITS: { pattern: RegExp; limit: number; context: string }[] = [
  { pattern: /\b(twitter|tweet|x post)\b/, limit: 280, context: "X (Twitter) post" },
  { pattern: /\binstagram\b/, limit: 2200, context: "Instagram caption" },
  { pattern: /\bmeta description\b/, limit: 160, context: "meta description" },
  { pattern: /\b(sms|text message)\b/, limit: 160, context: "SMS message" },
  { pattern: /\blinkedin\b/, limit: 3000, context: "LinkedIn post" },
  { pattern: /\byoutube title\b/, limit: 100, context: "YouTube title" },
];

const GENERIC_TEXT_WORDS = new Set("word words character characters char letter letters count counter checker check online free tool".split(" "));

const text = (params: Partial<TextParams>, primaryOutput: string): Mapping => ({
  engine: "text",
  params: { focus: "words", wordsPerMinute: 238, sample: SAMPLE_TEXT, ...params },
  primaryOutput,
});

function mapText(keyword: string): Mapping | null {
  if (/\breading time\b|\btime to read\b/.test(keyword)) return text({ focus: "reading" }, "readingTime");
  const isChars = /\b(character|characters|char|letter|letters)\b/.test(keyword) && /\b(count|counter|checker)\b/.test(keyword);
  const isWords = /\bword\b/.test(keyword) && /\b(count|counter|checker)\b/.test(keyword);
  if (!isChars && !isWords) return null;
  const platform = PLATFORM_LIMITS.find((p) => p.pattern.test(keyword));
  if (platform) return text({ focus: "characters", limit: platform.limit, context: platform.context }, "limitStatus");
  const essay = /\b(\d{2,5})[ -]word\b/.exec(keyword);
  if (/\bessay\b/.test(keyword) || essay) return text({ focus: "words", limit: essay ? Number(essay[1]) : 500, context: "essay" }, "limitStatus");
  // A qualifier we don't know ("pinterest description …") likely implies its own
  // limit; leave it to the LLM rather than folding it into the generic counter.
  const qualifiers = keyword.split(" ").filter((w) => !GENERIC_TEXT_WORDS.has(w));
  if (qualifiers.length) return null;
  return isChars ? text({ focus: "characters" }, "characters") : text({ focus: "words" }, "words");
}

export function ruleMap(keyword: string): Mapping | null {
  return mapUnits(keyword) ?? mapLoan(keyword) ?? mapText(keyword);
}

// ── LLM fallback ────────────────────────────────────────────────────────────

const unitKeys = Object.values(UNIT_CATEGORIES).flat().map((u) => u.key) as [string, ...string[]];

const LlmMapping = z.object({
  results: z.array(
    z.object({
      keyword: z.string(),
      engine: z.enum(["loan", "units", "text", "none"]),
      reason: z.string().describe("One sentence: why this engine fits, or why none does."),
      loan: z
        .object({
          loanLabel: z.string().describe('Capitalised loan type, e.g. "Auto loan", "Mortgage"'),
          defaultAmount: z.number(),
          maxAmount: z.number(),
          defaultRate: z.number().describe("Typical current APR in percent"),
          defaultTermMonths: z.number().int(),
          termOptions: z.array(z.number().int()),
          showDownPayment: z.boolean(),
        })
        .nullable(),
      units: z.object({ category: z.enum(["mass", "length", "temperature", "volume"]), from: z.enum(unitKeys), to: z.enum(unitKeys) }).nullable(),
      text: z
        .object({
          focus: z.enum(["words", "characters", "reading"]),
          limit: z.number().int().nullable(),
          context: z.string().nullable().describe('What the limit applies to, e.g. "Pinterest description"'),
        })
        .nullable(),
    }),
  ),
});

const MAP_SYSTEM = `You map search keywords to the tool engines of a programmatic SEO site. A keyword may only be mapped if one of these engines fully satisfies the searcher's intent:

- loan: amortising loan payment calculator (amount, APR, term → monthly payment, total interest, yearly schedule). Fill "loan" with realistic presets for that loan type.
- units: unit converter for these units only: ${Object.entries(UNIT_CATEGORIES).map(([c, us]) => `${c} (${us.map((u) => u.key).join(", ")})`).join("; ")}. Fill "units" with the category and unit keys.
- text: word/character counter with optional word or character limit, reading-time estimate. Fill "text".

Use engine "none" when the intent needs anything these engines cannot do (other units, other financial products such as investments or taxes, non-tool intents like "best", "near me", reviews or news). Do not stretch an engine to fit. Return exactly one result per input keyword, in the same order, with the fields for every engine other than the chosen one set to null.`;

async function llmMap(llm: LlmClient, keywords: KeywordRow[]) {
  const out = new Map<string, { mapping: Mapping | null; reason: string }>();
  for (let i = 0; i < keywords.length; i += 25) {
    const batch = keywords.slice(i, i + 25);
    const res = await llm.json({
      system: MAP_SYSTEM,
      user: `Map these keywords:\n${batch.map((k) => `- ${k.keyword}`).join("\n")}`,
      schema: LlmMapping,
    });
    for (const r of res.results) {
      const keyword = r.keyword.toLowerCase().trim();
      if (r.engine === "loan" && r.loan) out.set(keyword, { mapping: { engine: "loan", params: r.loan }, reason: r.reason });
      else if (r.engine === "units" && r.units) {
        const valid = UNIT_CATEGORIES[r.units.category].some((u) => u.key === r.units!.from) && UNIT_CATEGORIES[r.units.category].some((u) => u.key === r.units!.to);
        out.set(keyword, valid
          ? { mapping: { engine: "units", params: { ...unitParams(r.units.category, r.units.from, r.units.to) }, primaryOutput: "summary" }, reason: r.reason }
          : { mapping: null, reason: `Model returned units outside ${r.units.category}` });
      } else if (r.engine === "text" && r.text) {
        const { focus, limit, context } = r.text;
        const m = text({ focus, ...(limit ? { limit } : {}), ...(context ? { context } : {}) }, limit ? "limitStatus" : focus === "reading" ? "readingTime" : focus);
        out.set(keyword, { mapping: m, reason: r.reason });
      } else out.set(keyword, { mapping: null, reason: r.reason });
    }
  }
  return out;
}

// ── Clustering into pages ───────────────────────────────────────────────────

/**
 * Maps every keyword not already handled, then groups keywords by signature.
 * Groups that match an existing page (seed or earlier pipeline run) are
 * recorded as covered instead of creating a competing page.
 */
export async function mapKeywords(state: PipelineState, existing: PageSpec[], llm?: LlmClient): Promise<{ created: number; covered: number; unmapped: number; pending: number; llm: number }> {
  const handled = new Set([
    ...state.specs.flatMap((s) => [s.keyword, ...s.secondary]),
    ...state.covered.map((c) => c.keyword),
    ...state.unmapped.map((u) => u.keyword),
  ]);
  const todo = state.keywords.filter((k) => !handled.has(k.keyword));

  const mapped: { row: KeywordRow; mapping: Mapping; by: "rule" | "llm"; reason?: string }[] = [];
  const leftover: KeywordRow[] = [];
  for (const row of todo) {
    const m = ruleMap(row.keyword);
    if (m) mapped.push({ row, mapping: m, by: "rule" });
    else leftover.push(row);
  }

  const newUnmapped: Unmapped[] = [];
  if (leftover.length && llm) {
    const decisions = await llmMap(llm, leftover);
    for (const row of leftover) {
      const d = decisions.get(row.keyword);
      if (d?.mapping) mapped.push({ row, mapping: d.mapping, by: "llm", reason: d.reason });
      else newUnmapped.push({ keyword: row.keyword, volume: row.volume, reason: d?.reason ?? "No result returned for this keyword" });
    }
  }
  // Without an LLM, leftovers stay unhandled so a later run with a key picks them up.
  const pending = llm ? 0 : leftover.length;

  const existingBySig = new Map(existing.map((s) => [signatureOf(s.engine, s.params), s.slug]));
  const pipelineBySig = new Map(state.specs.map((s) => [s.signature, s]));
  const groups = new Map<string, typeof mapped>();
  for (const m of mapped) {
    const sig = signatureOf(m.mapping.engine, m.mapping.params);
    groups.set(sig, [...(groups.get(sig) ?? []), m]);
  }

  let created = 0;
  let covered = 0;
  const slugs = new Set([...existing.map((s) => s.slug), ...state.specs.map((s) => s.slug)]);
  for (const [sig, members] of groups) {
    members.sort((a, b) => b.row.volume - a.row.volume);
    const seedSlug = existingBySig.get(sig);
    if (seedSlug) {
      state.covered.push(...members.map((m) => ({ keyword: m.row.keyword, slug: seedSlug })));
      covered += members.length;
      continue;
    }
    const prior = pipelineBySig.get(sig);
    if (prior) {
      // A later CSV added synonyms of a page we already have: attach them.
      prior.secondary.push(...members.map((m) => m.row.keyword));
      prior.volume += members.reduce((s, m) => s + m.row.volume, 0);
      covered += members.length;
      continue;
    }
    const [lead, ...rest] = members;
    let slug = slugify(lead.row.keyword);
    for (let n = 2; slugs.has(slug); n++) slug = `${slugify(lead.row.keyword)}-${n}`;
    slugs.add(slug);
    const byLlm = members.some((m) => m.by === "llm");
    const spec: PipelineSpec = {
      slug,
      cluster: ENGINE_CLUSTER[lead.mapping.engine],
      engine: lead.mapping.engine,
      keyword: lead.row.keyword,
      secondary: rest.map((m) => m.row.keyword),
      volume: members.reduce((s, m) => s + m.row.volume, 0),
      params: lead.mapping.params,
      ...(lead.mapping.primaryOutput ? { primaryOutput: lead.mapping.primaryOutput } : {}),
      signature: sig,
      // LLM-chosen engines and presets are held for a human before any copy is written.
      status: byLlm ? "needs_review" : "approved",
      mappedBy: byLlm ? "llm" : "rule",
      ...(byLlm ? { mapReason: members.find((m) => m.by === "llm")?.reason } : {}),
    };
    state.specs.push(spec);
    pipelineBySig.set(sig, spec);
    created++;
  }
  state.unmapped.push(...newUnmapped);
  return { created, covered, unmapped: newUnmapped.length, pending, llm: llm ? leftover.length : 0 };
}
