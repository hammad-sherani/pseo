import { loanEngine } from "./loan";
import { unitsEngine } from "./units";
import { textEngine } from "./text";
import type { Engine } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ENGINES: Record<string, Engine<any>> = {
  [loanEngine.key]: loanEngine,
  [unitsEngine.key]: unitsEngine,
  [textEngine.key]: textEngine,
};

export function getEngine(key: string) {
  const engine = ENGINES[key];
  if (!engine) throw new Error(`Unknown engine "${key}"`);
  return engine;
}
