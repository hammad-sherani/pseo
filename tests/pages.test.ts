import { describe, expect, it } from "vitest";
import { PAGE_SPECS } from "@/db/seed-specs";
import { assemblePages } from "@/lib/assemble";
import { DUPLICATE_THRESHOLD, INDEX_THRESHOLD, similarity } from "@/lib/quality";
import { signature } from "@/lib/variant";
import { getEngine } from "@/engines";
import { INPUT_BLOCKS, OUTPUT_BLOCKS } from "@/blocks/catalog";

const pages = assemblePages(PAGE_SPECS, "2026-10-27T00:00:00.000Z");

describe("assembled pages", () => {
  it("is deterministic for the same input", () => {
    expect(assemblePages(PAGE_SPECS, "2026-10-27T00:00:00.000Z")).toEqual(pages);
  });

  it("gives every sibling page a unique (layout, primary output, section order)", () => {
    for (const cluster of new Set(pages.map((p) => p.cluster))) {
      const sigs = pages.filter((p) => p.cluster === cluster).map((p) => signature(p.ui));
      expect(new Set(sigs).size).toBe(sigs.length);
    }
  });

  it("uses several layouts and themes across the site", () => {
    expect(new Set(pages.map((p) => p.ui.toolLayout)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(pages.map((p) => p.ui.theme)).size).toBeGreaterThanOrEqual(4);
  });

  it("only references blocks and fields that exist and are compatible", () => {
    for (const p of pages) {
      const engine = getEngine(p.engine);
      const inputs = engine.inputs(p.params);
      const outputs = engine.outputs(p.params);
      for (const i of p.ui.inputs) {
        const field = inputs.find((f) => f.key === i.field)!;
        expect(field, `${p.slug}: ${i.field}`).toBeDefined();
        expect(INPUT_BLOCKS[i.block].supports(field), `${p.slug}: ${i.block}`).toBe(true);
      }
      for (const o of p.ui.outputs) {
        expect(OUTPUT_BLOCKS[o.block], `${p.slug}: ${o.block}`).toBeDefined();
        for (const k of o.fields) expect(outputs.some((f) => f.key === k), `${p.slug}: ${k}`).toBe(true);
      }
    }
  });

  it("keeps sibling copy below the duplicate threshold and passes the quality gate", () => {
    for (const a of pages) {
      for (const b of pages) {
        if (a.slug < b.slug && a.cluster === b.cluster) {
          expect(similarity(a.content, b.content), `${a.slug} vs ${b.slug}`).toBeLessThan(DUPLICATE_THRESHOLD);
        }
      }
      expect(a.qualityScore, a.slug).toBeGreaterThanOrEqual(INDEX_THRESHOLD);
      expect(a.status).toBe("published");
    }
  });
});
