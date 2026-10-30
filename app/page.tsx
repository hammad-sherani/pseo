import Link from "next/link";
import { getRepo } from "@/db/queries";
import { pagePath } from "@/seo";
import { ArrowRightIcon, BoltIcon, FormulaIcon, INTENT_ICONS, LockIcon } from "@/components/icons";
import { SearchTrigger } from "@/components/SearchTrigger";
import { ToolIndex } from "@/components/ToolIndex";

export const revalidate = 86400;

const PROMISES = [
  { Icon: BoltIcon, title: "Instant results", text: "Answers update as you type. No submit buttons, no page reloads." },
  { Icon: LockIcon, title: "Private by design", text: "Every calculation runs in your browser. Nothing you enter is sent anywhere." },
  { Icon: FormulaIcon, title: "Show the working", text: "Each tool explains the formula, so you can check the answer yourself." },
];

const POPULAR_COUNT = 6;
const PER_CATEGORY = 6;

export default async function Home() {
  const repo = getRepo();
  const clusters = await repo.listClusters();
  const byCluster = await Promise.all(clusters.map((c) => repo.listPages({ cluster: c.slug })));
  const total = byCluster.reduce((n, ps) => n + ps.length, 0);
  const clusterOf = new Map(clusters.map((c) => [c.slug, c]));
  const popular = byCluster.flat().sort((a, b) => b.searchVolume - a.searchVolume).slice(0, POPULAR_COUNT);

  return (
    <main className="home">
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <p className="kicker"><span className="live-dot" />{total} free tools · no sign-up</p>
            <h1>Calculators, converters and text tools <em>that just work.</em></h1>
            <p className="lede">Fast, private tools that run in your browser and show the formula behind every answer.</p>
            <SearchTrigger variant="hero" label={`Search ${total} tools`} />
            <p className="hero-popular">
              <span>Popular</span>
              {popular.slice(0, 3).map((p) => <Link key={p.slug} href={pagePath(p)}>{p.content.h1}</Link>)}
            </p>
          </div>

          <nav className="hero-index" aria-label="Browse by category">
            <p className="eyebrow">Browse by category</p>
            <ul>
              {clusters.map((c, i) => {
                const Icon = INTENT_ICONS[c.intent];
                return (
                  <li key={c.slug}>
                    <Link href={`/${c.slug}`}>
                      <span className="tile-icon"><Icon size={20} /></span>
                      <span className="hero-index-text"><strong>{c.name}</strong><small>{c.description}</small></span>
                      <span className="hero-index-count">{byCluster[i].length}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </section>

      <section className="container promises" aria-label="Why use these tools">
        {PROMISES.map(({ Icon, title, text }) => (
          <div key={title} className="promise">
            <Icon size={20} />
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
        ))}
      </section>

      <section className="container popular" aria-labelledby="popular">
        <div className="section-head">
          <p className="eyebrow">Most used</p>
          <h2 id="popular">Popular right now</h2>
        </div>
        <ol className="rank-list">
          {popular.map((p) => (
            <li key={p.slug}>
              <Link href={pagePath(p)}>
                <span className="rank-title">{p.content.h1}</span>
                <span className="rank-meta">{clusterOf.get(p.cluster)?.name}</span>
                <ArrowRightIcon size={18} className="row-arrow" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {clusters.map((c, i) => {
        const Icon = INTENT_ICONS[c.intent];
        const pages = byCluster[i];
        return (
          <section key={c.slug} aria-labelledby={`c-${c.slug}`} className="container category">
            <header className="category-intro">
              <span className="tile-icon tile-icon-lg"><Icon size={22} /></span>
              <h2 id={`c-${c.slug}`}>{c.name}</h2>
              <p>{c.description}</p>
              <Link href={`/${c.slug}`} className="text-link">Browse all {pages.length}<ArrowRightIcon size={16} /></Link>
            </header>
            <ToolIndex headingLevel={3} items={pages.slice(0, PER_CATEGORY).map((p) => ({
              title: p.content.h1, href: pagePath(p), description: p.seo.description, intent: c.intent,
            }))} />
          </section>
        );
      })}
    </main>
  );
}
