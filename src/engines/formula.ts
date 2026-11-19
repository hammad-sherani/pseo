import { calc, parse, variables } from "./expr";
import { formatNumber } from "@/lib/format";
import type { Engine, InputField, NumberFormat, OutputField, OutputValues } from "./types";

/**
 * One engine for every "inputs → formula → answer" tool. A tool is pure data
 * (these params), so adding a calculator means adding a definition in
 * src/formulas, not writing an engine, and the browser bundle does not grow.
 */
export interface FormulaParams {
  inputs: {
    key: string;
    label: string;
    default: number;
    unit?: string;
    format?: NumberFormat;
    min?: number;
    max?: number;
    step?: number;
    /** Renders a choice instead of a number box; the chosen value feeds the formula. */
    options?: { value: number; label: string }[];
  }[];
  /** Evaluated in order; later expressions may use earlier output keys. The first is the headline. */
  outputs: { key: string; label: string; expr: string; format?: NumberFormat; unit?: string; decimals?: number }[];
  /** One-sentence answer, with {key} replaced by formatted values. Units are not added: write them in the text. */
  summary: string;
  /** Optional label for a value range, e.g. BMI categories. Bands are checked in order. */
  verdict?: { of: string; bands: { below?: number; text: string }[] };
  /** Human-readable formula shown on the page. */
  formula: string;
}

const RESERVED = new Set(["summary", "verdict"]);

/** Throws if a definition references unknown names or has malformed expressions. */
export function validateFormula(p: FormulaParams) {
  const known = new Set<string>();
  for (const i of p.inputs) {
    if (known.has(i.key) || RESERVED.has(i.key)) throw new Error(`Duplicate or reserved key "${i.key}"`);
    known.add(i.key);
  }
  for (const o of p.outputs) {
    const missing = [...variables(parse(o.expr))].filter((v) => !known.has(v));
    if (missing.length) throw new Error(`Output "${o.key}" uses unknown ${missing.join(", ")}`);
    if (known.has(o.key) || RESERVED.has(o.key)) throw new Error(`Duplicate or reserved key "${o.key}"`);
    known.add(o.key);
  }
  for (const [, key] of p.summary.matchAll(/\{(\w+)\}/g)) if (!known.has(key)) throw new Error(`Summary uses unknown {${key}}`);
  if (p.verdict && !known.has(p.verdict.of)) throw new Error(`Verdict uses unknown "${p.verdict.of}"`);
}

export const formulaEngine: Engine<FormulaParams> = {
  key: "formula",
  inputs: (p) =>
    p.inputs.map((i): InputField =>
      i.options
        ? { key: i.key, type: "select", label: i.label, options: i.options }
        : { key: i.key, type: "number", label: i.label, unit: i.unit, min: i.min, max: i.max, step: i.step }),
  outputs: (p) => [
    ...p.outputs.map((o): OutputField => ({ key: o.key, kind: "number", label: o.label, format: o.format, unit: o.unit })),
    // The sentence carries the verdict too, so it is always shown.
    { key: "summary", kind: "text", label: "Answer", essential: true },
  ],
  defaults: (p) => Object.fromEntries(p.inputs.map((i) => [i.key, i.default])),
  run(input, p) {
    const scope: Record<string, number> = {};
    for (const i of p.inputs) {
      const v = Number(input[i.key]);
      if (input[i.key] === "" || !Number.isFinite(v)) throw new Error(`Invalid ${i.key}`);
      scope[i.key] = v;
    }
    const out: OutputValues = {};
    for (const o of p.outputs) {
      let v = calc(o.expr, scope);
      if (!Number.isFinite(v)) throw new Error(`${o.key} is not a finite number`);
      if (o.decimals !== undefined) v = Math.round(v * 10 ** o.decimals) / 10 ** o.decimals;
      out[o.key] = scope[o.key] = v;
    }
    const fields = [...p.inputs, ...p.outputs];
    const sentence = p.summary.replace(/\{(\w+)\}/g, (_, k: string) => {
      const f = fields.find((x) => x.key === k)!;
      return formatNumber(scope[k], f.format);
    });
    if (p.verdict) {
      const v = scope[p.verdict.of];
      out.verdict = p.verdict.bands.find((b) => b.below === undefined || v < b.below)?.text ?? "";
    }
    out.summary = out.verdict ? `${sentence} (${out.verdict})` : sentence;
    return out;
  },
  formula: (p) => p.formula,
};
