// Content pipeline CLI. State lives in data/pipeline/state.json; every
// command is resumable and safe to re-run.
//
//   npm run pipeline -- ingest data/keywords.csv
//   npm run pipeline -- map                 # rules, then Claude for leftovers
//   npm run pipeline -- review              # list LLM mappings awaiting a human
//   npm run pipeline -- approve <slug>... | --all
//   npm run pipeline -- reject <slug>...
//   npm run pipeline -- generate [--limit 50] [--concurrency 4]
//   npm run pipeline -- publish [--per-day 200]
//   npm run pipeline -- status
import fs from "node:fs";
import { PAGE_SPECS } from "../../src/db/seed-specs";
import { assemblePages } from "../../src/lib/assemble";
import { pagePath } from "../../src/seo";
import { generate } from "./generate";
import { ingestCsv } from "./ingest";
import { anthropicLlm, MODEL } from "./llm";
import { mapKeywords } from "./map";
import { publishedSpecs, releaseBatch, revalidate } from "./publish";
import { loadState, PUBLISHED_FILE, saveJson, saveState, STATE_FILE } from "./store";

const [command, ...rest] = process.argv.slice(2);
const flag = (name: string, fallback?: number) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? Number(rest[i + 1]) : fallback;
};
const positional = rest.filter((a, i) => !a.startsWith("--") && !rest[i - 1]?.startsWith("--"));
const hasCredentials = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE);

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const state = loadState();

switch (command) {
  case "ingest": {
    const file = positional[0];
    if (!file) fail("Usage: ingest <file.csv>");
    const rows = ingestCsv(fs.readFileSync(file, "utf8"));
    const byKeyword = new Map(state.keywords.map((k) => [k.keyword, k]));
    let added = 0;
    for (const r of rows) {
      if (!byKeyword.has(r.keyword)) added++;
      byKeyword.set(r.keyword, r);
    }
    state.keywords = [...byKeyword.values()].sort((a, b) => b.volume - a.volume);
    saveState(state);
    console.log(`Read ${rows.length} keywords; ${added} new. ${state.keywords.length} total.`);
    break;
  }

  case "map": {
    const useLlm = !rest.includes("--no-llm") && (hasCredentials || rest.includes("--llm"));
    const r = await mapKeywords(state, PAGE_SPECS, useLlm ? anthropicLlm() : undefined);
    saveState(state);
    console.log(`New pages: ${r.created}. Keywords merged into existing pages: ${r.covered}. No engine fits: ${r.unmapped}.`);
    if (r.llm) console.log(`${r.llm} keywords went to ${MODEL}; its mappings wait for review (npm run pipeline -- review).`);
    if (r.pending) console.log(`${r.pending} keywords matched no rule and were left for the LLM step. Set ANTHROPIC_API_KEY (or pass --llm) and run map again.`);
    break;
  }

  case "review": {
    const pending = state.specs.filter((s) => s.status === "needs_review");
    if (!pending.length) console.log("Nothing to review.");
    for (const s of pending) {
      const { sample: _s, chartValues: _c, ...params } = s.params as Record<string, unknown>;
      console.log(`\n${s.slug}  (${s.engine}, volume ${s.volume})\n  keywords: ${[s.keyword, ...s.secondary].join(", ")}\n  reason:   ${s.mapReason}\n  params:   ${JSON.stringify(params)}`);
    }
    break;
  }

  case "approve":
  case "reject": {
    const all = rest.includes("--all");
    const targets = state.specs.filter((s) => s.status === "needs_review" && (all || positional.includes(s.slug)));
    for (const s of targets) s.status = command === "approve" ? "approved" : "rejected";
    saveState(state);
    console.log(`${command === "approve" ? "Approved" : "Rejected"} ${targets.length}: ${targets.map((s) => s.slug).join(", ") || "none"}`);
    break;
  }

  case "generate": {
    if (!hasCredentials && !rest.includes("--llm")) fail("generate needs Claude: set ANTHROPIC_API_KEY (or pass --llm to use an `ant auth login` profile).");
    let done = 0;
    const queue = await generate(state, anthropicLlm(), {
      limit: flag("limit"),
      concurrency: flag("concurrency", 4),
      existing: PAGE_SPECS,
      onProgress: (spec, verdict) => {
        saveState(state);
        done++;
        const detail = spec.status === "generated" ? `score ${verdict?.score}` : spec.error;
        console.log(`[${done}] ${spec.status === "generated" ? "ok  " : "FAIL"} ${spec.slug} — ${detail}`);
      },
    });
    const failed = queue.filter((s) => s.status === "failed").length;
    console.log(`Generated ${queue.length - failed}/${queue.length}.${failed ? " Failed pages stay queued; run generate again to retry." : ""}`);
    break;
  }

  case "publish": {
    const batch = releaseBatch(state, flag("per-day", 200)!);
    saveState(state);
    const specs = publishedSpecs(state);
    saveJson(PUBLISHED_FILE, specs);
    console.log(`Published ${batch.length} pages today${batch.length ? `: ${batch.map((s) => s.slug).join(", ")}` : ""}.`);

    if (batch.length && process.env.DATABASE_URL) {
      const { writePages } = await import("../db-write");
      // Assemble everything so variants and quality scores see all siblings, then write only the new pages.
      const all = [...PAGE_SPECS, ...specs];
      const slugs = new Set(batch.map((s) => s.slug));
      await writePages(process.env.DATABASE_URL, assemblePages(all).filter((p) => slugs.has(p.slug)), all);
      console.log(`Wrote ${batch.length} rows to Postgres.`);
    }
    if (batch.length && process.env.SITE_URL && process.env.REVALIDATE_SECRET) {
      const paths = [...batch.map(pagePath), ...new Set(batch.map((s) => `/${s.cluster}`)), "/"];
      await revalidate(paths, process.env.SITE_URL, process.env.REVALIDATE_SECRET);
      console.log(`Revalidated ${paths.length} paths on ${process.env.SITE_URL}.`);
    } else if (batch.length) {
      console.log("SITE_URL/REVALIDATE_SECRET not set: new pages appear on the next build or ISR revalidation.");
    }
    break;
  }

  case "status": {
    const counts: Record<string, number> = {};
    for (const s of state.specs) counts[s.status] = (counts[s.status] ?? 0) + 1;
    console.log(`State: ${STATE_FILE}`);
    console.log(`Keywords: ${state.keywords.length} · merged into existing pages: ${state.covered.length} · no engine fits: ${state.unmapped.length}`);
    console.log(`Pages: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(" · ") || "none"}`);
    for (const s of state.specs.filter((x) => x.status === "failed")) console.log(`  failed ${s.slug}: ${s.error}`);
    for (const u of state.unmapped.slice(0, 10)) console.log(`  unmapped "${u.keyword}" (${u.volume}): ${u.reason}`);
    break;
  }

  default:
    console.log("Commands: ingest <csv> · map [--no-llm|--llm] · review · approve <slug...>|--all · reject <slug...> · generate [--limit N] [--concurrency N] · publish [--per-day N] · status");
}
