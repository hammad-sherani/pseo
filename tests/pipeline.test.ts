import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { PAGE_SPECS } from "@/db/seed-specs";
import { assemblePages } from "@/lib/assemble";
import { ingestCsv, parseCsv } from "../scripts/pipeline/ingest";
import { mapKeywords, ruleMap } from "../scripts/pipeline/map";
import { generate, review, unsupportedNumbers, type Editorial } from "../scripts/pipeline/generate";
import { publishedSpecs, releaseBatch } from "../scripts/pipeline/publish";
import { emptyState } from "../scripts/pipeline/store";
import type { LlmClient } from "../scripts/pipeline/llm";
import type { PipelineState } from "../scripts/pipeline/types";

// Distinct vocabulary per page so fake copy does not trip the duplicate check.
const WORDS = "harbor ledger quartz meadow signal timber orbit canvas ember lattice summit pivot willow cobalt fable prism anchor velvet tundra mosaic".split(" ");
function fakeCopy(keyword: string, extra = ""): Editorial {
  const seed = [...keyword].reduce((s, c) => s + c.charCodeAt(0), 0);
  const w = (i: number) => WORDS[(seed * (i + 3)) % WORDS.length];
  const phrase = (i: number) => `${w(i)} ${w(i + 1)} ${w(i + 2)} ${w(i + 3)} ${keyword} ${w(i + 4)} ${w(i + 5)}`;
  return {
    intro: `${phrase(0)} ${phrase(1)} ${phrase(2)} ${phrase(3)} explains the ${keyword} plainly${extra}.`,
    howTo: [phrase(4), phrase(5), phrase(6)],
    faq: [0, 1, 2].map((i) => ({ q: `${phrase(7 + i)}?`, a: `${phrase(10 + i)} ${phrase(13 + i)}.` })),
  };
}

/** Fake LLM: maps by keyword rules given in `mapping`, writes copy via `writer`. */
function fakeLlm(writer: (user: string, call: number) => Editorial, mapping: Record<string, unknown> = {}): LlmClient & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async json({ user }) {
      calls.push(user);
      if (user.startsWith("Map these keywords")) {
        const kws = [...user.matchAll(/^- (.+)$/gm)].map((m) => m[1]);
        return { results: kws.map((keyword) => mapping[keyword] ?? { keyword, engine: "none", reason: "No engine computes this.", loan: null, units: null, text: null }) } as never;
      }
      return writer(user, calls.length) as never;
    },
  };
}

const stateWith = (csv: string): PipelineState => ({ ...emptyState(), keywords: ingestCsv(csv) });

describe("ingest", () => {
  it("parses quoted CSV and maps tool-specific headers", () => {
    expect(parseCsv('a,"b, c","d ""e"""\r\n1,2,3')).toEqual([["a", "b, c", 'd "e"'], ["1", "2", "3"]]);
    const rows = ingestCsv("﻿Keyword,Search Volume,Keyword Difficulty\n KG to LBS ,\"1,200\",40\nkg to lbs,900,1\n\nfeet to meters,50,");
    expect(rows).toEqual([{ keyword: "kg to lbs", volume: 1200, kd: 40 }, { keyword: "feet to meters", volume: 50 }]);
  });

  it("rejects a file without a keyword column", () => {
    expect(() => ingestCsv("term,volume\nx,1")).toThrow(/No keyword column/);
  });
});

describe("rule mapping", () => {
  it.each([
    ["kg to lbs", "units:kg:lb"],
    ["kilograms to pounds", "units:kg:lb"],
    ["convert feet to meters", "units:ft:m"],
    ["how many ounces in a pound", "units:lb:oz"],
    ["meters to feet converter", "units:m:ft"],
    ["car payment calculator", "loan:auto loan"],
    ["rv loan calculator", "loan:rv loan"],
    ["instagram caption character counter", "text:characters:2200:instagram caption"],
    ["1000 word essay counter", "text:words:1000:essay"],
    ["word count checker", "text:words::"],
  ])("%s → %s", async (keyword, signature) => {
    const { signatureOf } = await import("../scripts/pipeline/map");
    const m = ruleMap(keyword)!;
    expect(m, keyword).not.toBeNull();
    expect(signatureOf(m.engine, m.params)).toBe(signature);
  });

  it.each(["mpg calculator", "best pizza near me", "kg to miles", "kg to kg"])("leaves %s unmapped", (k) => {
    expect(ruleMap(k)).toBeNull();
  });
});

describe("clustering", () => {
  it("merges synonyms into one page and skips keywords existing pages already serve", async () => {
    const state = stateWith(fs.readFileSync("data/keywords.example.csv", "utf8"));
    const r = await mapKeywords(state, PAGE_SPECS);
    const bySlug = Object.fromEntries(state.specs.map((s) => [s.slug, s]));

    // car/auto loan, kg to lbs and word count checker are served by seed pages.
    expect(state.covered.map((c) => c.keyword).sort()).toEqual(
      ["auto loan calculator", "car loan calculator", "car payment calculator", "kg to lbs", "kilograms to pounds", "word count checker"],
    );
    // "how many ounces in a pound" and "pounds to ounces" are one page led by the bigger keyword.
    expect(bySlug["how-many-ounces-in-a-pound"].secondary).toEqual(["pounds to ounces"]);
    expect(bySlug["how-many-ounces-in-a-pound"].volume).toBe(246000 + 90500);
    expect(bySlug["rv-loan-calculator"].status).toBe("approved");
    // Without an LLM, unmatched keywords stay pending rather than being written off.
    expect(r.pending).toBe(3);
    expect(state.unmapped).toEqual([]);
  });

  it("sends leftovers to the LLM and holds its mappings for review", async () => {
    const state = stateWith("keyword,volume\npinterest description character counter,700\nmpg calculator,1000\n");
    const llm = fakeLlm(() => fakeCopy("x"), {
      "pinterest description character counter": {
        keyword: "pinterest description character counter", engine: "text", reason: "Character limit tool.",
        loan: null, units: null, text: { focus: "characters", limit: 500, context: "Pinterest description" },
      },
    });
    const r = await mapKeywords(state, PAGE_SPECS, llm);
    expect(r).toMatchObject({ created: 1, unmapped: 1, llm: 2 });
    expect(state.specs[0]).toMatchObject({ status: "needs_review", mappedBy: "llm", primaryOutput: "limitStatus" });
    expect(state.unmapped[0]).toMatchObject({ keyword: "mpg calculator", reason: "No engine computes this." });

    // A re-run doesn't call the LLM again for handled keywords.
    const again = await mapKeywords(state, PAGE_SPECS, llm);
    expect(again.created + again.llm).toBe(0);
  });
});

describe("generation", () => {
  const spec = () => {
    const s = stateWith("keyword,volume\nrv loan calculator,27100\nmotorcycle loan calculator,22200\n");
    return s;
  };

  it("flags figures the facts sheet does not contain", () => {
    const ed = fakeCopy("rv loan calculator");
    ed.faq.push({ q: "What APR should I expect?", a: "Most lenders charge 7.9% to 9.25% for 15 years, about $1,234 a month." });
    const facts = { presets: { defaultRate: 8.2 }, formula: "APR ÷ 12" };
    expect(unsupportedNumbers(ed, facts).sort()).toEqual(["1234", "15", "7.9", "9.25"]);
    expect(unsupportedNumbers({ ...ed, faq: [{ q: "Rate?", a: "About 8.2%, divided by 12, over 3 steps." }] }, facts)).toEqual([]);
  });

  it("retries with feedback when a draft invents numbers, then saves the clean draft", async () => {
    const state = spec();
    await mapKeywords(state, PAGE_SPECS);
    const llm = fakeLlm((user, call) => {
      const keyword = /targeting "(.+?)"/.exec(user)![1];
      return call === 1 ? fakeCopy(keyword, " at 7.9% APR") : fakeCopy(keyword);
    });
    await generate(state, llm, { existing: PAGE_SPECS, concurrency: 1, limit: 1 });
    const rv = state.specs.find((s) => s.slug === "rv-loan-calculator")!;
    expect(rv.status).toBe("generated");
    expect(llm.calls[1]).toContain("These figures are not in FACTS, remove or replace them: 7.9.");
    expect(rv.editorial?.intro).not.toContain("7.9");
    // limit: 1 leaves the lower-volume page queued.
    expect(state.specs.find((s) => s.slug === "motorcycle-loan-calculator")!.status).toBe("approved");
  });

  it("rejects copy that duplicates a sibling and marks the page failed after retries", async () => {
    const state = spec();
    await mapKeywords(state, PAGE_SPECS);
    const same = fakeCopy("loan calculator");
    await generate(state, fakeLlm(() => same), { existing: PAGE_SPECS, concurrency: 1 });
    const [first, second] = [...state.specs].sort((a, b) => b.volume - a.volume);
    expect(first.status).toBe("generated");
    expect(second.status).toBe("failed");
    expect(second.error).toMatch(/Too similar to the sibling page "rv-loan-calculator"/);
  });

  it("records refusals and API errors as failures without stopping the run", async () => {
    const state = spec();
    await mapKeywords(state, PAGE_SPECS);
    const llm: LlmClient = { json: async () => { throw new Error("Model declined (cyber): test"); } };
    const queue = await generate(state, llm, { existing: PAGE_SPECS });
    expect(queue.map((s) => s.status)).toEqual(["failed", "failed"]);
    expect(queue[0].error).toContain("Model declined");
  });

  it("generated copy passes the site's own quality gate", async () => {
    const state = spec();
    await mapKeywords(state, PAGE_SPECS);
    await generate(state, fakeLlm((u) => fakeCopy(/targeting "(.+?)"/.exec(u)![1])), { existing: PAGE_SPECS });
    for (const s of state.specs) expect(review(s, s.editorial as Editorial, PAGE_SPECS.filter((p) => p.cluster === s.cluster)).ok).toBe(true);
  });
});

describe("drip publishing", () => {
  const generated = () => {
    const state = emptyState();
    for (const [i, slug] of ["a", "b", "c", "d", "e"].entries()) {
      state.specs.push({
        slug: `${slug}-to-b`, cluster: "converters", engine: "units", keyword: slug, secondary: [], volume: 100 - i,
        params: {}, signature: slug, status: "generated", mappedBy: "rule",
      });
    }
    return state;
  };

  it("releases at most perDay pages per UTC day, highest volume first", () => {
    const state = generated();
    const day1 = new Date("2026-10-27T09:00:00Z");
    expect(releaseBatch(state, 2, day1).map((s) => s.slug)).toEqual(["a-to-b", "b-to-b"]);
    expect(releaseBatch(state, 2, new Date("2026-10-27T18:00:00Z"))).toEqual([]);
    expect(releaseBatch(state, 2, new Date("2026-10-28T00:30:00Z")).map((s) => s.slug)).toEqual(["c-to-b", "d-to-b"]);
    expect(publishedSpecs(state).map((s) => s.slug)).toEqual(["a-to-b", "b-to-b", "c-to-b", "d-to-b"]);
  });

  it("adding pipeline pages leaves existing pages' layouts unchanged", async () => {
    const state = stateWith(fs.readFileSync("data/keywords.example.csv", "utf8"));
    await mapKeywords(state, PAGE_SPECS);
    await generate(state, fakeLlm((u) => fakeCopy(/targeting "(.+?)"/.exec(u)![1])), { existing: PAGE_SPECS });
    releaseBatch(state, 100, new Date("2026-10-27T00:00:00Z"));
    const before = assemblePages(PAGE_SPECS, "t");
    const after = assemblePages([...PAGE_SPECS, ...publishedSpecs(state)], "t");
    expect(after.slice(0, before.length).map((p) => p.ui)).toEqual(before.map((p) => p.ui));
    expect(after.length).toBe(before.length + publishedSpecs(state).length);
    expect(after.every((p) => p.status === "published")).toBe(true);
  });
});
