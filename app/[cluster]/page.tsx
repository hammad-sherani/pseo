import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRepo } from "@/db/queries";
import { SITE_URL, pagePath } from "@/seo";
import { FormulaIcon, INTENT_ICONS, LockIcon } from "@/components/icons";
import { ToolIndex } from "@/components/ToolIndex";

type Params = Promise<{ cluster: string }>;

export const revalidate = 86400;

export async function generateStaticParams() {
  return (await getRepo().listClusters()).map((c) => ({ cluster: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { cluster: slug } = await params;
  const cluster = (await getRepo().listClusters()).find((c) => c.slug === slug);
  if (!cluster) return {};
  return {
    title: `${cluster.name} – Free Online Tools`,
    description: cluster.description,
    alternates: { canonical: `${SITE_URL}/${cluster.slug}` },
  };
}

const MAX_TAGS = 3;

export default async function ClusterHub({ params }: { params: Params }) {
  const { cluster: slug } = await params;
  const repo = getRepo();
  const cluster = (await repo.listClusters()).find((c) => c.slug === slug);
  if (!cluster) notFound();
  const pages = await repo.listPages({ cluster: slug });

  const Icon = INTENT_ICONS[cluster.intent];

  return (
    <main className="hub">
      <header className="hub-header">
        <div className="container">
          <nav aria-label="Breadcrumb" className="crumbs">
            <ol><li><Link href="/">Home</Link></li><li aria-current="page">{cluster.name}</li></ol>
          </nav>
          <div className="hub-header-grid">
            <div>
              <span className="tile-icon tile-icon-lg"><Icon size={24} /></span>
              <h1>{cluster.name}</h1>
              <p className="lede">{cluster.description}</p>
            </div>
            <dl className="facts">
              <div><dt>Tools</dt><dd className="facts-num">{pages.length}</dd></div>
              <div><dt>Privacy</dt><dd><LockIcon size={16} />Runs in your browser</dd></div>
              <div><dt>Method</dt><dd><FormulaIcon size={16} />Formula on every page</dd></div>
            </dl>
          </div>
        </div>
      </header>
      <section className="container hub-body" aria-labelledby="all-tools">
        <h2 id="all-tools" className="section-title">All {cluster.name.toLowerCase()}</h2>
        <ToolIndex headingLevel={3} filterable items={pages.map((p) => ({
          title: p.content.h1, href: pagePath(p), description: p.seo.description, intent: cluster.intent,
          tags: p.secondaryKeywords.slice(0, MAX_TAGS),
        }))} />
      </section>
    </main>
  );
}
