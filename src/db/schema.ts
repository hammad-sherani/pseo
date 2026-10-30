import {
  pgTable, serial, text, integer, jsonb, timestamp, primaryKey, index, pgEnum, real,
} from "drizzle-orm/pg-core";

export const intentEnum = pgEnum("intent", ["calculate", "convert", "generate", "check"]);
export const statusEnum = pgEnum("page_status", ["draft", "review", "published", "noindex"]);
export const linkKindEnum = pgEnum("link_kind", ["related", "parent", "sibling"]);

// Registry rows mirror the code registries (src/engines, src/layouts, src/theme)
// so the pipeline and admin can query what exists and which versions are live.
export const toolEngines = pgTable("tool_engines", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  version: integer("version").notNull().default(1),
  inputSchema: jsonb("input_schema").notNull(),
  outputSchema: jsonb("output_schema").notNull(),
});

export const layouts = pgTable("layouts", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  slots: jsonb("slots").notNull(),
});

export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  tokens: jsonb("tokens").notNull(),
});

export const keywordClusters = pgTable("keyword_clusters", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  parentId: integer("parent_id"),
  intent: intentEnum("intent").notNull(),
});

export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    clusterId: integer("cluster_id").notNull().references(() => keywordClusters.id),
    engineKey: text("engine_key").notNull().references(() => toolEngines.key),
    primaryKeyword: text("primary_keyword").notNull(),
    secondaryKeywords: text("secondary_keywords").array().notNull().default([]),
    searchVolume: integer("search_volume").notNull().default(0),
    kd: integer("kd"),
    engineParams: jsonb("engine_params").notNull(),
    uiConfig: jsonb("ui_config").notNull(),
    content: jsonb("content").notNull(),
    seo: jsonb("seo").notNull(),
    status: statusEnum("status").notNull().default("draft"),
    qualityScore: integer("quality_score").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("pages_cluster_status_idx").on(t.clusterId, t.status),
    index("pages_secondary_kw_gin").using("gin", t.secondaryKeywords),
  ],
);

export const pageLinks = pgTable(
  "page_links",
  {
    fromPageId: integer("from_page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
    toPageId: integer("to_page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
    anchorText: text("anchor_text").notNull(),
    kind: linkKindEnum("kind").notNull(),
  },
  (t) => [primaryKey({ columns: [t.fromPageId, t.toPageId] })],
);

export const redirects = pgTable("redirects", {
  fromPath: text("from_path").primaryKey(),
  toPath: text("to_path").notNull(),
});

export const pageMetrics = pgTable(
  "page_metrics",
  {
    pageId: integer("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "string" }).notNull(),
    impressions: integer("impressions").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    avgPosition: real("avg_position"),
    engagementSec: real("engagement_sec"),
  },
  (t) => [primaryKey({ columns: [t.pageId, t.date] })],
);
