// Block metadata without React imports, so the variant generator and
// pipeline scripts can reason about compatibility on the server.
import type { InputField, OutputField, OutputKind } from "@/engines/types";

export interface InputBlockMeta {
  supports: (f: InputField) => boolean;
}

export interface OutputBlockMeta {
  kind: OutputKind | OutputKind[];
  /** "one" renders a single field; "many" groups several. */
  arity: "one" | "many";
  heavy?: boolean;
}

export const INPUT_BLOCKS: Record<string, InputBlockMeta> = {
  NumberField: { supports: (f) => f.type === "number" },
  Slider: { supports: (f) => f.type === "number" && f.min !== undefined && f.max !== undefined },
  Stepper: { supports: (f) => f.type === "number" && (f.step ?? 1) >= 0.1 },
  SegmentedToggle: { supports: (f) => f.type === "select" && (f.options?.length ?? 0) <= 5 },
  Dropdown: { supports: (f) => f.type === "select" },
  ChipGroup: { supports: (f) => f.type === "select" && (f.options?.length ?? 0) <= 8 },
  TextArea: { supports: (f) => f.type === "longtext" },
};

export const OUTPUT_BLOCKS: Record<string, OutputBlockMeta> = {
  BigStat: { kind: "number", arity: "one" },
  StatGrid: { kind: "number", arity: "many" },
  StatList: { kind: "number", arity: "many" },
  Sentence: { kind: "text", arity: "one" },
  CopyBox: { kind: ["text", "number"], arity: "one" },
  ResultTable: { kind: "table", arity: "one" },
  BarBreakdown: { kind: "breakdown", arity: "one" },
  Donut: { kind: "breakdown", arity: "one", heavy: true },
};

export function compatibleInputBlocks(field: InputField): string[] {
  return Object.entries(INPUT_BLOCKS).filter(([, m]) => m.supports(field)).map(([k]) => k);
}

export function compatibleOutputBlocks(kind: OutputKind, arity: "one" | "many"): string[] {
  return Object.entries(OUTPUT_BLOCKS)
    .filter(([, m]) => (Array.isArray(m.kind) ? m.kind.includes(kind) : m.kind === kind) && m.arity === arity)
    .map(([k]) => k);
}

export function outputKindOf(fields: OutputField[], key: string): OutputKind | undefined {
  return fields.find((f) => f.key === key)?.kind;
}
