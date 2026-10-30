import type { KeywordRow } from "./types";

/** RFC 4180-style parser: quoted fields, escaped quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

// Header names used by common keyword tools (Ahrefs, Semrush, Google Keyword Planner).
const KEYWORD_HEADERS = ["keyword", "keywords", "query", "search term"];
const VOLUME_HEADERS = ["volume", "search volume", "avg. monthly searches", "sv"];
const KD_HEADERS = ["kd", "keyword difficulty", "difficulty"];

const findCol = (header: string[], names: string[]) => header.findIndex((h) => names.includes(h.trim().toLowerCase()));
const toInt = (s: string | undefined) => {
  const n = Number(String(s ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
};

export const normalizeKeyword = (k: string) =>
  k.toLowerCase().replace(/[“”"]/g, "").replace(/\s+/g, " ").trim();

/** Parses a keyword export and merges duplicate keywords, keeping the highest volume. */
export function ingestCsv(text: string): KeywordRow[] {
  const [header, ...rows] = parseCsv(text.replace(/^﻿/, ""));
  if (!header) return [];
  const kw = findCol(header, KEYWORD_HEADERS);
  const vol = findCol(header, VOLUME_HEADERS);
  const kd = findCol(header, KD_HEADERS);
  if (kw < 0) throw new Error(`No keyword column found. Expected one of: ${KEYWORD_HEADERS.join(", ")}`);

  const byKeyword = new Map<string, KeywordRow>();
  for (const r of rows) {
    const keyword = normalizeKeyword(r[kw] ?? "");
    if (!keyword) continue;
    const row: KeywordRow = { keyword, volume: vol >= 0 ? toInt(r[vol]) : 0 };
    if (kd >= 0 && r[kd]?.trim()) row.kd = toInt(r[kd]);
    const prev = byKeyword.get(keyword);
    if (!prev || prev.volume < row.volume) byKeyword.set(keyword, row);
  }
  return [...byKeyword.values()].sort((a, b) => b.volume - a.volume);
}
