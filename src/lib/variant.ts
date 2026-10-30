import type { Engine, OutputField } from "@/engines/types";
import { compatibleInputBlocks, compatibleOutputBlocks } from "@/blocks/catalog";
import { CONTENT_SECTIONS, HERO_STYLES, UiConfig, type ContentSection, type ToolLayout } from "@/schemas/page";
import { THEME_KEYS } from "@/theme/themes";

export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
const pick = <T,>(r: Rand, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const shuffle = <T,>(r: Rand, xs: readonly T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function layoutsFor(engine: Engine<any>, params: unknown): ToolLayout[] {
  const fields = engine.inputs(params);
  if (fields.some((f) => f.type === "longtext")) return ["editor", "split-pane", "stacked-card", "dashboard"];
  const options: ToolLayout[] = ["split-pane", "stacked-card", "dashboard"];
  if (fields.length >= 3) options.push("wizard");
  if (fields.length <= 3) options.push("inline-sentence");
  return options;
}

export interface VariantInput {
  slug: string;
  engine: Engine<any>;
  params: unknown;
  /** Output field to feature first; defaults to the first numeric output. */
  primaryOutput?: string;
  /** Signatures already used by sibling pages in the same cluster. */
  taken: Set<string>;
}

export const signature = (ui: UiConfig) =>
  `${ui.toolLayout}|${ui.outputs[0].block}|${ui.sections.join(",")}`;

/**
 * Deterministically derives a page's UI from its slug, constrained by what
 * the engine's fields support, and re-rolls until the (layout, primary
 * output block, section order) tuple is unique among its siblings.
 */
export function buildUiConfig({ slug, engine, params, primaryOutput, taken }: VariantInput): UiConfig {
  for (let attempt = 0; attempt < 50; attempt++) {
    const ui = roll(rng(hash(`${slug}#${attempt}`)), engine, params, primaryOutput);
    if (!taken.has(signature(ui))) {
      taken.add(signature(ui));
      return ui;
    }
  }
  throw new Error(`Could not find a unique variant for ${slug}`);
}

function roll(r: Rand, engine: Engine<any>, params: unknown, primaryOutput?: string): UiConfig {
  const toolLayout = pick(r, layoutsFor(engine, params));
  const fields = engine.inputs(params);
  const outFields = engine.outputs(params);

  const inputs = fields.map((f) => {
    let blocks = compatibleInputBlocks(f);
    if (toolLayout === "inline-sentence") blocks = blocks.filter((b) => b === "NumberField" || b === "Dropdown");
    return { block: pick(r, blocks), field: f.key };
  });

  const byKind = (k: OutputField["kind"]) => outFields.filter((f) => f.kind === k);
  const primary = outFields.find((f) => f.key === primaryOutput) ?? byKind("number")[0];
  const outputs: UiConfig["outputs"] = [
    { block: pick(r, compatibleOutputBlocks(primary.kind, "one")), fields: [primary.key] },
  ];

  const groups: UiConfig["outputs"] = [];
  const otherNumbers = byKind("number").filter((f) => f !== primary).slice(0, 2 + Math.floor(r() * 3));
  if (otherNumbers.length) groups.push({ block: pick(r, compatibleOutputBlocks("number", "many")), fields: otherNumbers.map((f) => f.key) });
  for (const f of byKind("text").filter((f) => f !== primary)) {
    if (r() < 0.7) groups.push({ block: pick(r, compatibleOutputBlocks("text", "one")), fields: [f.key] });
  }
  for (const f of byKind("breakdown")) groups.push({ block: pick(r, compatibleOutputBlocks("breakdown", "one")), fields: [f.key] });
  outputs.push(...shuffle(r, groups));
  // Tables are long; keep them last, sometimes collapsed (still in the DOM for crawlers).
  for (const f of byKind("table")) outputs.push({ block: "ResultTable", fields: [f.key], collapsed: r() < 0.4 });

  const body = CONTENT_SECTIONS.filter((s) => s !== "faq" && s !== "related" && (s !== "formula" || engine.formula));
  const sections: ContentSection[] = [...shuffle(r, body), ...shuffle(r, ["faq", "related"] as const)];

  return UiConfig.parse({
    toolLayout,
    theme: pick(r, THEME_KEYS),
    heroStyle: pick(r, HERO_STYLES),
    inputs,
    outputs,
    sections,
  });
}
