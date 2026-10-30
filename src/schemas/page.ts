import { z } from "zod";

export const TOOL_LAYOUTS = ["split-pane", "stacked-card", "wizard", "inline-sentence", "dashboard", "editor"] as const;
export const HERO_STYLES = ["centered", "left", "compact"] as const;
export const CONTENT_SECTIONS = ["howTo", "examples", "formula", "faq", "related"] as const;

export const InputBlockConfig = z.object({
  block: z.string(),
  field: z.string(),
  label: z.string().optional(),
});

export const OutputBlockConfig = z.object({
  block: z.string(),
  fields: z.array(z.string()).min(1),
  label: z.string().optional(),
  collapsed: z.boolean().optional(),
});

export const UiConfig = z.object({
  toolLayout: z.enum(TOOL_LAYOUTS),
  theme: z.string(),
  heroStyle: z.enum(HERO_STYLES),
  inputs: z.array(InputBlockConfig).min(1),
  outputs: z.array(OutputBlockConfig).min(1),
  sections: z.array(z.enum(CONTENT_SECTIONS)),
});

export const Content = z.object({
  h1: z.string().min(5),
  intro: z.string().min(40),
  howTo: z.array(z.string()).min(2),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).min(2),
  examples: z.array(z.object({ title: z.string(), detail: z.string() })),
  formula: z.string().optional(),
});

export const Seo = z.object({
  title: z.string().max(70),
  description: z.string().min(50).max(170),
  schemaType: z.enum(["WebApplication", "SoftwareApplication"]).default("WebApplication"),
  applicationCategory: z.string().default("UtilitiesApplication"),
});

export const PageStatus = z.enum(["draft", "review", "published", "noindex"]);

export const Page = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  cluster: z.string(),
  engine: z.string(),
  primaryKeyword: z.string(),
  secondaryKeywords: z.array(z.string()),
  searchVolume: z.number().int().nonnegative(),
  params: z.record(z.unknown()),
  ui: UiConfig,
  content: Content,
  seo: Seo,
  status: PageStatus,
  qualityScore: z.number().int().min(0).max(100),
  updatedAt: z.string(),
});

export const Cluster = z.object({
  slug: z.string(),
  name: z.string(),
  intent: z.enum(["calculate", "convert", "generate", "check"]),
  description: z.string(),
});

export type UiConfig = z.infer<typeof UiConfig>;
export type InputBlockConfig = z.infer<typeof InputBlockConfig>;
export type OutputBlockConfig = z.infer<typeof OutputBlockConfig>;
export type Content = z.infer<typeof Content>;
export type Seo = z.infer<typeof Seo>;
export type Page = z.infer<typeof Page>;
export type Cluster = z.infer<typeof Cluster>;
export type ToolLayout = (typeof TOOL_LAYOUTS)[number];
export type ContentSection = (typeof CONTENT_SECTIONS)[number];
