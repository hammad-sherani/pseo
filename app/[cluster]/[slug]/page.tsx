import Link from "next/link";
import { notFound } from "next/navigation";
import { getPage, getRepo } from "@/db/queries";
import { ToolRuntime } from "@/components/ToolRuntime";
import { SECTION_COMPONENTS } from "@/blocks/content";
import { jsonLdScript, pageJsonLd, pageMetadata } from "@/seo";
import { themeStyle } from "@/theme/themes";
import { CalendarIcon, FormulaIcon, INTENT_ICONS, LockIcon } from "@/components/icons";
import { Toc } from "@/components/Toc";
import { AdSlot } from "@/components/AdSlot";
import type { ContentSection, Page } from "@/schemas/page";

const SECTION_LABELS: Record<ContentSection, { id: string; label: string }> = {
  howTo: { id: "how-to", label: "How to use" },
  examples: { id: "examples", label: "Worked examples" },
  formula: { id: "formula", label: "The formula" },
  faq: { id: "faq", label: "FAQ" },
  related: { id: "related", label: "Related tools" },
};

/** Sections that render something for this page, in page order. */
const visibleSections = (page: Page, related: Page[]) =>
  page.ui.sections.filter((k) =>
    k === "examples" ? page.content.examples.length > 0 : k === "formula" ? Boolean(page.content.formula) : k === "related" ? related.length > 0 : true);

type Params = Promise<{ cluster: string; slug: string }>;

// Highest-volume pages are prerendered at build; the long tail renders on
// first request and is cached (ISR), so build time stays flat as pages grow.
export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const pages = await getRepo().listPages({ limit: Number(process.env.PRERENDER_LIMIT ?? 1000) });
  return pages.map((p) => ({ cluster: p.cluster, slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { cluster, slug } = await params;
  const page = await getPage(cluster, slug);
  return page ? pageMetadata(page) : {};
}

export default async function ToolPage({ params }: { params: Params }) {
  const { cluster: clusterSlug, slug } = await params;
  const page = await getPage(clusterSlug, slug);
  if (!page) notFound();

  const repo = getRepo();
  const [clusters, related] = await Promise.all([repo.listClusters(), repo.related(page)]);
  const cluster = clusters.find((c) => c.slug === page.cluster)!;
  const { ui, content } = page;

  const sections = visibleSections(page, related);
  const updated = new Date(page.updatedAt).toLocaleDateString("en-US", { dateStyle: "long" });

  const CategoryIcon = INTENT_ICONS[cluster.intent];

  return (
    <main className={`page hero-${ui.heroStyle} layout-${ui.toolLayout}`} style={themeStyle(ui.theme)}>
      <article>
        <header className="tool-head">
          <div className="container">
            <nav aria-label="Breadcrumb" className="crumbs">
              <ol>
                <li><Link href="/">Home</Link></li>
                <li><Link href={`/${cluster.slug}`}>{cluster.name}</Link></li>
                <li aria-current="page">{content.h1}</li>
              </ol>
            </nav>
            <div className="tool-head-grid">
              <div className="tool-head-copy">
                <Link href={`/${cluster.slug}`} className="cat-chip"><CategoryIcon size={15} />{cluster.name}</Link>
                <h1>{content.h1}</h1>
                <p className="lede">{content.intro}</p>
              </div>
              <dl className="facts">
                <div><dt>Privacy</dt><dd><LockIcon size={16} />Runs in your browser</dd></div>
                {content.formula && <div><dt>Method</dt><dd><FormulaIcon size={16} />Formula shown below</dd></div>}
                <div><dt>Updated</dt><dd><CalendarIcon size={16} /><time dateTime={page.updatedAt}>{updated}</time></dd></div>
              </dl>
            </div>
          </div>
        </header>

        <div className="container">
          <section aria-label={`${content.h1} tool`} className="workspace">
            <ToolRuntime slug={page.slug} engineKey={page.engine} params={page.params} ui={ui} />
          </section>
          <AdSlot position="belowTool" />

          <div className="page-body">
            <div className="page-sections">
              {sections.map((key, i) => {
                const Section = SECTION_COMPONENTS[key];
                // One mid-content ad after the second section, only on pages long enough to carry it.
                return i === 1 && sections.length > 2
                  ? [<Section key={key} page={page} related={related} />, <AdSlot key="ad" position="inContent" />]
                  : <Section key={key} page={page} related={related} />;
              })}
              <AdSlot position="end" />
            </div>
            {sections.length > 1 && (
              <aside className="page-rail">
                <Toc items={sections.map((k) => SECTION_LABELS[k])} />
                <AdSlot position="rail" />
              </aside>
            )}
          </div>
        </div>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(pageJsonLd(page, cluster)) }} />
    </main>
  );
}
