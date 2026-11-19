// Server-side registry (content builder, variants, pipeline, tests). The
// browser never imports this file: ToolRuntime loads one engine per page.
import { loanEngine } from "./loan";
import { unitsEngine } from "./units";
import { textEngine } from "./text";
import { formulaEngine } from "./formula";
import type { Engine } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ENGINES: Record<string, Engine<any>> = {
  [loanEngine.key]: loanEngine,
  [unitsEngine.key]: unitsEngine,
  [textEngine.key]: textEngine,
  [formulaEngine.key]: formulaEngine,
};

export function getEngine(key: string) {
  const engine = ENGINES[key];
  if (!engine) throw new Error(`Unknown engine "${key}"`);
  return engine;
}
