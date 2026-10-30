// Deterministic content builder. In production this step is the Claude
// pipeline (scripts/pipeline/generate); it is kept here so the platform runs
// end to end without an API key. Every number in examples comes from the
// engine itself, never from free text.
import { getEngine } from "@/engines";
import type { LoanParams } from "@/engines/loan";
import { getUnit, type UnitParams } from "@/engines/units";
import type { TextParams } from "@/engines/text";
import type { Table } from "@/engines/types";
import { formatNumber } from "@/lib/format";
import type { Content, Seo } from "@/schemas/page";

export interface PageSpec {
  slug: string;
  cluster: string;
  engine: string;
  keyword: string;
  secondary: string[];
  volume: number;
  params: Record<string, unknown>;
  primaryOutput?: string;
  /**
   * Page-specific copy (from the LLM step or an editor). It is what keeps
   * siblings that share an engine from reading as near-duplicates.
   */
  editorial?: {
    intro?: string;
    howTo?: string[];
    faq?: { q: string; a: string }[];
    examples?: { title: string; detail: string }[];
  };
}

const ACRONYMS = new Set(["rv", "sba", "sms", "mpg", "apr", "seo", "usd", "bmi", "pdf"]);
const titleCase = (s: string) =>
  s.replace(/\b\w+/g, (w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)));
const usd = (x: number) => formatNumber(x, "currency");
const termLabel = (m: number) => (m % 12 === 0 ? `${m / 12}-year` : `${m}-month`);

function loanContent(spec: PageSpec): Content {
  const p = spec.params as unknown as LoanParams;
  const e = getEngine("loan");
  const base = e.defaults(p);
  const run = (over: Record<string, number>) => e.run({ ...base, ...over }, p);
  const now = run({});
  const shorter = p.termOptions.filter((t) => t < p.defaultTermMonths).at(-1) ?? p.termOptions[0];
  const short = run({ term: shorter });
  const cheaper = run({ rate: Math.max(0, p.defaultRate - 1) });
  const label = p.loanLabel.toLowerCase();
  return {
    h1: titleCase(spec.keyword),
    intro: `Estimate the monthly payment on ${/^[aeiou]/.test(label) ? "an" : "a"} ${label} before you talk to a lender. Enter the ${label} amount${p.showDownPayment ? ", your down payment" : ""}, the APR you were quoted and the term, and this ${spec.keyword} shows your payment, the total interest you will pay and how each year of the loan splits between principal and interest.`,
    howTo: [
      `Enter the full ${label} amount${p.showDownPayment ? " and subtract nothing yourself: put your down payment in its own field" : ""}.`,
      `Type the annual percentage rate (APR) from your offer. Typical ${label} rates sit around ${p.defaultRate}% today.`,
      `Choose a term. Common ${label} terms are ${p.termOptions.map(termLabel).join(", ")}.`,
      "Read your monthly payment, then open the yearly schedule to see how fast the balance falls.",
    ],
    examples: [
      { title: `${usd(Number(base.amount))} over ${termLabel(p.defaultTermMonths)} at ${p.defaultRate}%`, detail: `Monthly payment ${usd(now.monthlyPayment as number)}, total interest ${usd(now.totalInterest as number)}.` },
      { title: `Same ${label}, ${termLabel(shorter)} term`, detail: `Payment rises to ${usd(short.monthlyPayment as number)} but you save ${usd((now.totalInterest as number) - (short.totalInterest as number))} in interest.` },
      { title: `One point lower rate (${Math.max(0, p.defaultRate - 1)}%)`, detail: `Payment drops to ${usd(cheaper.monthlyPayment as number)}; interest falls by ${usd((now.totalInterest as number) - (cheaper.totalInterest as number))}.` },
    ],
    formula: e.formula?.(p),
    faq: [
      { q: `How is a ${label} payment calculated?`, a: `With the standard amortization formula: each month you pay a fixed amount, and the interest portion is the remaining balance times the monthly rate (APR ÷ 12). Early payments are mostly interest; later ones are mostly principal.` },
      { q: `Is a shorter ${label} term worth it?`, a: `A shorter term raises the monthly payment but cuts total interest. In the example above, moving from ${termLabel(p.defaultTermMonths)} to ${termLabel(shorter)} saves ${usd((now.totalInterest as number) - (short.totalInterest as number))}.` },
      { q: "Does this include taxes, fees or insurance?", a: `No. The result covers principal and interest only. Add any fees, taxes${p.loanLabel === "Mortgage" ? ", homeowners insurance and PMI" : " or insurance"} your lender lists to get your full monthly cost.` },
      { q: "What APR should I enter?", a: "Use the APR on your loan estimate or pre-approval. If you have not been quoted yet, try a range of rates to see how sensitive your payment is." },
    ],
  };
}

function unitContent(spec: PageSpec): Content {
  const p = spec.params as unknown as UnitParams;
  const e = getEngine("units");
  const from = getUnit(p.category, p.from);
  const to = getUnit(p.category, p.to);
  const one = e.run({ value: 1, from: p.from, to: p.to }, p);
  const samples = [p.chartValues[2], p.chartValues[5], p.chartValues.at(-1)!].map((v) => ({
    v, out: e.run({ value: v, from: p.from, to: p.to }, p),
  }));
  const reverse = e.run({ value: 1, from: p.to, to: p.from }, p);
  return {
    h1: `${titleCase(from.name)} to ${titleCase(to.name)} Converter (${from.symbol} to ${to.symbol})`,
    intro: `Convert ${from.name} to ${to.name} instantly. Type any value in ${from.name} and get the exact result in ${to.name}, the formula behind it and a ready-made ${from.symbol} to ${to.symbol} chart you can scan without typing anything. ${one.summary}.`,
    howTo: [
      `Enter the number of ${from.name} you want to convert.`,
      `Keep "${from.name}" as the starting unit and "${to.name}" as the target, or switch either to any other ${p.category} unit.`,
      `Read the answer: ${e.formula?.(p)}.`,
    ],
    examples: samples.map(({ v, out }) => ({ title: `How many ${to.name} is ${v} ${from.symbol}?`, detail: `${out.summary}.` })),
    formula: e.formula?.(p),
    faq: [
      { q: `How do you convert ${from.name} to ${to.name}?`, a: `${e.formula?.(p)}. For example, ${samples[0].out.summary}.` },
      { q: `What is 1 ${from.symbol} in ${to.symbol}?`, a: `${one.summary}.` },
      { q: `How do I go from ${to.name} back to ${from.name}?`, a: `Swap the units: ${reverse.summary}.` },
      { q: `Is ${spec.keyword} conversion exact?`, a: `Yes. The factors used are the internationally defined ones, and results are rounded to six significant figures for display.` },
    ],
  };
}

function textContent(spec: PageSpec): Content {
  const p = spec.params as unknown as TextParams;
  const e = getEngine("text");
  const sample = e.run({ text: p.sample }, p);
  const kw = sample.keywords as Table;
  return {
    h1: titleCase(spec.keyword),
    intro: `Paste your text into the ${spec.keyword} and every statistic updates as you type. Nothing is uploaded.`,
    howTo: ["Paste or type your text into the box.", "Read the counts as they update."],
    examples: [
      p.focus === "characters"
        ? { title: "Characters in the sample text", detail: `${sample.characters} with spaces, ${sample.charactersNoSpaces} without.` }
        : p.focus === "reading"
          ? { title: "Reading time for the sample", detail: `${sample.words} words take about ${formatNumber(sample.readingTime as number, "minutes")} to read at ${p.wordsPerMinute} wpm.` }
          : { title: "Most frequent word in the sample", detail: kw.rows[0] ? `"${kw.rows[0][0]}" appears ${kw.rows[0][1]} times (${kw.rows[0][2]} density).` : "No repeated words." },
    ],
    faq: [
      { q: "Is my text stored anywhere?", a: "No. Counting happens in your browser and the text never leaves your device." },
    ],
  };
}

const BUILDERS: Record<string, (s: PageSpec) => Content> = { loan: loanContent, units: unitContent, text: textContent };

/**
 * Template content for the engine, with page-specific editorial copy layered
 * on top. Editorial FAQs replace the templated ones except the first, which
 * carries engine-computed figures; worked examples always stay engine-made.
 */
export function buildContent(spec: PageSpec): Content {
  const base = BUILDERS[spec.engine](spec);
  const ed = spec.editorial;
  if (!ed) return base;
  return {
    ...base,
    intro: ed.intro ?? base.intro,
    howTo: ed.howTo ?? base.howTo,
    examples: [...(ed.examples ?? []), ...base.examples],
    faq: ed.faq?.length ? [...ed.faq, base.faq[0]] : base.faq,
  };
}

export function buildSeo(spec: PageSpec, content: Content): Seo {
  // The layout appends " | Toolhaus"; keep the page part short enough that
  // the whole title stays inside Google's ~60-character display width.
  const withSuffix = `${content.h1} – Free & Instant`;
  return {
    title: withSuffix.length <= 50 ? withSuffix : content.h1.slice(0, 60),
    description: content.intro.length <= 160 ? content.intro : `${content.intro.slice(0, content.intro.lastIndexOf(" ", 156))}…`,
    schemaType: "WebApplication",
    applicationCategory: spec.engine === "loan" ? "FinanceApplication" : "UtilitiesApplication",
  };
}
