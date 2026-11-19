import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calc, parse } from "@/engines/expr";
import { formulaEngine, validateFormula } from "@/engines/formula";
import { ENGINES } from "@/engines";
import { FORMULA_TOOLS } from "@/formulas";
import { CLUSTERS, PAGE_SPECS } from "@/db/seed-specs";

describe("expression language", () => {
  it("follows the usual precedence rules", () => {
    expect(calc("2 + 3 * 4", {})).toBe(14);
    expect(calc("(2 + 3) * 4", {})).toBe(20);
    expect(calc("2 ^ 3 ^ 2", {})).toBe(512);
    expect(calc("-2 ^ 2", {})).toBe(-4);
    expect(calc("10 / 4 - 1", {})).toBe(1.5);
  });

  it("supports names, constants, functions and comparisons", () => {
    expect(calc("x * 2 + y", { x: 3, y: 1 })).toBe(7);
    expect(calc("round(pi, 2)", {})).toBe(3.14);
    expect(calc("max(1, 5, 3) + min(4, 2)", {})).toBe(7);
    expect(calc("if(x > 10, 1, 2)", { x: 11 })).toBe(1);
    expect(calc("sqrt(16) + abs(-2) + mod(7, 3)", {})).toBe(7);
  });

  it("rejects anything that is not arithmetic", () => {
    for (const bad of ["2 +", "foo(1)", "alert('x')", "a.b", "1 2", "sqrt(1, 2)", "x = 1"]) {
      expect(() => parse(bad), bad).toThrow();
    }
    expect(() => calc("missing + 1", {})).toThrow();
  });
});

describe("formula tools", () => {
  it("are valid definitions with unique slugs", () => {
    const slugs = PAGE_SPECS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const clusters = new Set(CLUSTERS.map((c) => c.slug));
    for (const t of FORMULA_TOOLS) {
      expect(() => validateFormula(t.params), t.slug).not.toThrow();
      expect(clusters.has(t.cluster), `${t.slug}: cluster ${t.cluster}`).toBe(true);
      expect(t.checks.length, `${t.slug} needs a known-answer check`).toBeGreaterThan(0);
      // Defaults and every worked example must produce an answer.
      expect(() => formulaEngine.run(formulaEngine.defaults(t.params), t.params), t.slug).not.toThrow();
      for (const x of t.formula.examples) {
        expect(() => formulaEngine.run({ ...formulaEngine.defaults(t.params), ...x.values }, t.params), `${t.slug}: ${x.title}`).not.toThrow();
      }
    }
  });

  it("match their hand-verified answers", () => {
    for (const t of FORMULA_TOOLS) {
      for (const c of t.checks) {
        const out = formulaEngine.run({ ...formulaEngine.defaults(t.params), ...c.values }, t.params);
        for (const [k, want] of Object.entries(c.expect)) {
          if (typeof want === "number") expect(out[k], `${t.slug}.${k}`).toBeCloseTo(want, 2);
          else expect(out[k], `${t.slug}.${k}`).toBe(want);
        }
      }
    }
  });

  it("rejects bad input instead of showing a wrong answer", () => {
    const bmi = FORMULA_TOOLS.find((t) => t.slug === "bmi-calculator")!.params;
    expect(() => formulaEngine.run({ weight: 70, height: 0 }, bmi)).toThrow();
    expect(() => formulaEngine.run({ weight: "", height: 175 }, bmi)).toThrow();
  });

  it("catches definitions that reference unknown names", () => {
    expect(() => validateFormula({ inputs: [{ key: "a", label: "A", default: 1 }], outputs: [{ key: "b", label: "B", expr: "a + c" }], summary: "{b}", formula: "" })).toThrow(/unknown c/);
    expect(() => validateFormula({ inputs: [{ key: "a", label: "A", default: 1 }], outputs: [{ key: "b", label: "B", expr: "a" }], summary: "{z}", formula: "" })).toThrow();
  });
});

describe("client runtime", () => {
  it("has a lazily loaded runtime for every engine", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../src/components/ToolRuntime.tsx"), "utf8");
    for (const key of Object.keys(ENGINES)) expect(src, key).toMatch(new RegExp(`\\b${key}: dynamic\\(`));
    expect(src).not.toMatch(/from "@\/engines"/);
  });
});
