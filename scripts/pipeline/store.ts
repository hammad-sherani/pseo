import fs from "node:fs";
import path from "node:path";
import type { PipelineState } from "./types";

export const STATE_FILE = path.resolve(process.env.PIPELINE_STATE ?? "data/pipeline/state.json");
/** Read by the site (src/db/queries.ts) when no DATABASE_URL is set. */
export const PUBLISHED_FILE = path.resolve("data/published-specs.json");

export const emptyState = (): PipelineState => ({ version: 1, keywords: [], covered: [], unmapped: [], specs: [] });

export function loadState(file = STATE_FILE): PipelineState {
  if (!fs.existsSync(file)) return emptyState();
  return JSON.parse(fs.readFileSync(file, "utf8")) as PipelineState;
}

/** Write-then-rename so a crash mid-write never leaves a truncated state file. */
export function saveJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

export const saveState = (state: PipelineState, file = STATE_FILE) => saveJson(file, state);
