# pSEO Tools Platform

Generates many distinct, working tool pages (calculators, converters, text tools) from keyword data. Each page is composed at render time from a JSON config: **engine** (logic) × **layout + blocks** (UI) × **content** (copy).

```bash
npm install
npm test            # engine maths + page assembly invariants
npm run build && npm start
```

Without `DATABASE_URL` the site serves the in-repo seed (`src/db/seed-specs.ts`). To use Postgres:

```bash
DATABASE_URL=postgres://... npm run db:push   # create tables from src/db/schema.ts
DATABASE_URL=postgres://... npm run db:seed   # write assembled pages
```

## How a page is built

```
keyword spec ──► buildContent ──► buildUiConfig (variant) ──► quality gate ──► pages row
 (seed-specs)    (lib/content)     (lib/variant)               (lib/quality)    (Page schema)

request /[cluster]/[slug]
  └─ RSC page: metadata + JSON-LD + server-rendered content sections
       └─ <ToolRuntime> (only client island): engine + input/output blocks inside a tool layout,
          SSR'd with default inputs so the HTML already contains a real result
```

| Layer | Where | Keyed by |
|---|---|---|
| Engines (pure functions) | `src/engines/*` | `pages.engine_key` |
| Input / output blocks | `src/blocks/inputs`, `src/blocks/outputs` | `ui.inputs[].block`, `ui.outputs[].block` |
| Block compatibility | `src/blocks/catalog.ts` | field type / output kind |
| Tool layouts | `src/layouts/tool.tsx` | `ui.toolLayout` |
| Content sections | `src/blocks/content` | `ui.sections[]` (order varies per page) |
| Themes (CSS variables) | `src/theme/themes.ts` | `ui.theme` |
| Config validation | `src/schemas/page.ts` (Zod) | — |

**Variation:** `buildUiConfig` derives layout, theme, hero style, widgets and section order from a hash of the slug, limited to blocks the engine's fields support. It then re-rolls until the (layout, primary output, section order) tuple is unique within the cluster.

**Quality gate:** sibling pages are compared with 4-word shingle Jaccard similarity. Copy that is too templated gets a low score and ships as `noindex`, and is left out of the sitemap. The `editorial` field on a spec holds page-specific copy (the slot the LLM step fills).

## Adding a tool type

1. Write an engine in `src/engines/` (`inputs`, `outputs`, `defaults`, `run`, optional `formula`) and register it in `src/engines/index.ts`.
2. Add a content builder in `src/lib/content.ts`. Worked-example numbers must come from `engine.run`.
3. Add keyword specs and `npm test`. The tests check block compatibility, unique variants and duplicate copy.

New blocks need a component in `src/blocks/{inputs,outputs}` and an entry in `src/blocks/catalog.ts`.

## Content pipeline

Turns a keyword export into published pages. State lives in `data/pipeline/state.json` (commit it: it is the review record), and every command is resumable.

```bash
npm run pipeline -- ingest data/keywords.example.csv   # Ahrefs / Semrush / Keyword Planner headers
npm run pipeline -- map                                 # rules first, Claude for leftovers
npm run pipeline -- review                              # LLM mappings wait here for a human
npm run pipeline -- approve <slug> ...                  # or --all; reject <slug> to drop
npm run pipeline -- generate --limit 50                 # Claude writes the editorial copy
npm run pipeline -- publish --per-day 200               # run daily (cron); releases the next batch
npm run pipeline -- status
```

| Step | What happens | Where |
|---|---|---|
| ingest | Parses CSV, normalises and dedupes keywords (highest volume wins) | `scripts/pipeline/ingest.ts` |
| map | Rule tables map keywords to an engine + params (unit aliases, loan presets, platform character limits). Keywords with the same engine+params *signature* become one page (biggest keyword primary, the rest secondary); signatures an existing page already serves are recorded as covered, not duplicated. Leftovers go to Claude in batches of 25 with a strict schema; its mappings land in `needs_review`. | `scripts/pipeline/map.ts` |
| generate | Claude gets a facts sheet computed by the engine (defaults, results, chart rows, formula, worked examples) plus sibling intros to avoid, and returns `{intro, howTo, faq}`. Each draft is checked: every figure must appear in the facts (small integers excepted), copy-only overlap with siblings must stay under 50%, and the page must clear the site's indexing score. A failed draft gets one retry with the problems quoted back; a second failure is marked `failed` and retried on the next run. | `scripts/pipeline/generate.ts` |
| publish | Releases up to `--per-day` generated pages per UTC day, highest volume first. Writes `data/published-specs.json` (read by the site without a database), upserts rows when `DATABASE_URL` is set, and calls `/api/revalidate` when `SITE_URL` and `REVALIDATE_SECRET` are set. | `scripts/pipeline/publish.ts` |

**Claude settings** (`scripts/pipeline/llm.ts`): `claude-opus-5-5` (override with `PIPELINE_MODEL`), effort `medium`, structured output via `betaZodOutputFormat`, cached system prompt, and server-side refusal fallback (`fallbacks: "default"`), so a safety decline is retried on another model inside the same call. Credentials come from `ANTHROPIC_API_KEY`, or pass `--llm` to use an `ant auth login` profile. Without credentials, `map` still runs the rules and leaves the rest pending.

Loan rates and terms come from presets in `map.ts` that an editor maintains. The model never supplies them for rule-mapped pages, and its suggestions for LLM-mapped pages are reviewed before any copy is written.

## Not built yet

- `/admin` review/preview UI (review happens in the CLI for now), GSC import into `page_metrics`, redirect middleware for `redirects`.
- The Postgres paths (`pgRepo`, `scripts/seed.ts`, `publish` with `DATABASE_URL`) type-check but have not been run against a live database.
- The Claude calls have only run against a fake client in tests; no live generation run has been done yet.
# pseo
