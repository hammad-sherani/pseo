import { describe, expect, it } from "vitest";
import { loanEngine, type LoanParams } from "@/engines/loan";
import { convert, unitsEngine, type UnitParams } from "@/engines/units";
import { textEngine, type TextParams } from "@/engines/text";
import type { Table } from "@/engines/types";

describe("loan engine", () => {
  const p: LoanParams = { loanLabel: "Auto loan", defaultAmount: 30000, maxAmount: 100000, defaultRate: 6, defaultTermMonths: 60, termOptions: [36, 60], showDownPayment: false };

  it("matches the standard amortization formula", () => {
    // $30,000 at 6% APR over 60 months = $579.98/month (bank-published figure).
    const out = loanEngine.run({ amount: 30000, rate: 6, term: 60 }, p);
    expect(out.monthlyPayment).toBeCloseTo(579.98, 2);
    expect(out.totalCost).toBeCloseTo(579.98 * 60, 0);
  });

  it("handles a 0% rate and subtracts the down payment", () => {
    const out = loanEngine.run({ amount: 12000, downPayment: 2000, rate: 0, term: 10 }, { ...p, showDownPayment: true });
    expect(out.monthlyPayment).toBe(1000);
    expect(out.totalInterest).toBe(0);
  });

  it("produces one schedule row per year, ending at a zero balance", () => {
    const t = loanEngine.run({ amount: 30000, rate: 6, term: 60 }, p).schedule as Table;
    expect(t.rows).toHaveLength(5);
    expect(t.rows.at(-1)!.at(-1)).toBe("$0");
  });
});

describe("units engine", () => {
  it("converts mass, length and temperature exactly", () => {
    expect(convert("mass", "kg", "lb", 1)).toBeCloseTo(2.20462262, 6);
    expect(convert("length", "in", "cm", 1)).toBeCloseTo(2.54, 10);
    expect(convert("temperature", "c", "f", 100)).toBeCloseTo(212, 10);
    expect(convert("temperature", "f", "c", -40)).toBeCloseTo(-40, 10);
    expect(convert("temperature", "k", "c", 0)).toBeCloseTo(-273.15, 10);
  });

  it("builds a summary and chart from params", () => {
    const p: UnitParams = { category: "mass", from: "kg", to: "lb", defaultValue: 10, chartValues: [1, 2] };
    const out = unitsEngine.run(unitsEngine.defaults(p), p);
    expect(out.summary).toBe("10 kg = 22.0462 lb");
    expect((out.chart as Table).rows).toEqual([[1, "2.20462"], [2, "4.40925"]]);
  });
});

describe("text engine", () => {
  const p: TextParams = { focus: "words", wordsPerMinute: 200, sample: "", limit: 5 };

  it("counts words, sentences and paragraphs", () => {
    const out = textEngine.run({ text: "Don't stop. Keep going!\n\nNew paragraph here." }, p);
    expect(out.words).toBe(7);
    expect(out.sentences).toBe(3);
    expect(out.paragraphs).toBe(2);
    expect(out.limitStatus).toBe("2 over the 5 limit");
  });

  it("returns zeros for empty input", () => {
    const out = textEngine.run({ text: "" }, p);
    expect(out.words).toBe(0);
    expect(out.sentences).toBe(0);
  });
});
