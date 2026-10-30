export type FieldType = "number" | "select" | "longtext";

export interface InputField {
  key: string;
  type: FieldType;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number; label: string }[];
  placeholder?: string;
}

export type OutputKind = "number" | "table" | "breakdown" | "text";
export type NumberFormat = "currency" | "number" | "percent" | "minutes" | "integer";

export interface OutputField {
  key: string;
  kind: OutputKind;
  label: string;
  format?: NumberFormat;
  unit?: string;
}

export interface Table {
  columns: string[];
  rows: (string | number)[][];
}

export interface BreakdownItem {
  label: string;
  value: number;
}

export type InputValues = Record<string, string | number>;
export type OutputValues = Record<string, number | string | Table | BreakdownItem[]>;

/**
 * An engine is pure computation shared by server (SSR default result,
 * worked examples) and client (interactive island). Params are the
 * per-page presets stored in pages.engine_params.
 */
export interface Engine<P = Record<string, unknown>> {
  key: string;
  inputs(params: P): InputField[];
  outputs(params: P): OutputField[];
  defaults(params: P): InputValues;
  run(input: InputValues, params: P): OutputValues;
  formula?(params: P): string;
}
