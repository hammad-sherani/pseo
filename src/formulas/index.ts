// Formula tools: calculators that are pure data on top of the formula engine
// (src/engines/formula.ts). To add one, add an entry to a category file with
// at least one known-answer check; tests/formula.test.ts runs every check.
import type { FormulaParams } from "@/engines/formula";
import type { PageSpec } from "@/lib/content";
import { FINANCE_FORMULAS } from "./finance";
import { HEALTH_FORMULAS } from "./health";
import { MATH_FORMULAS } from "./math";

export interface FormulaTool extends Omit<PageSpec, "engine" | "params" | "formula"> {
  params: FormulaParams;
  formula: NonNullable<PageSpec["formula"]>;
  /** Hand-verified answers: inputs → expected outputs (numbers to 2 decimals, or exact text). */
  checks: { values: Record<string, number>; expect: Record<string, number | string> }[];
}

export const FORMULA_TOOLS: FormulaTool[] = [...MATH_FORMULAS, ...HEALTH_FORMULAS, ...FINANCE_FORMULAS];

export const formulaSpecs = (): PageSpec[] =>
  FORMULA_TOOLS.map(({ checks: _checks, params, ...tool }) => ({ ...tool, engine: "formula", params: params as unknown as Record<string, unknown> }));
