// Server-rendered content sections. These are plain HTML in the response,
// so the copy crawlers index never depends on client JavaScript.
import Link from "next/link";
import type { ComponentType } from "react";
import type { ContentSection, Page } from "@/schemas/page";
import { pagePath } from "@/seo";
import { ArrowRightIcon, ChevronIcon } from "@/components/icons";

interface SectionProps {
  page: Page;
  related: Page[];
}

function HowTo({ page }: SectionProps) {
  return (
    <section aria-labelledby="how-to" className="prose">
      <h2 id="how-to">How to use the {page.primaryKeyword}</h2>
      <ol className="steps-list">{page.content.howTo.map((s) => <li key={s}>{s}</li>)}</ol>
    </section>
  );
}

function Examples({ page }: SectionProps) {
  if (!page.content.examples.length) return null;
  return (
    <section aria-labelledby="examples" className="prose">
      <h2 id="examples">Worked examples</h2>
      <div className="examples">
        {page.content.examples.map((e) => (
          <article key={e.title} className="example">
            <h3>{e.title}</h3>
            <p>{e.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Formula({ page }: SectionProps) {
  if (!page.content.formula) return null;
  return (
    <section aria-labelledby="formula" className="prose">
      <h2 id="formula">The formula</h2>
      <p className="formula"><code>{page.content.formula}</code></p>
    </section>
  );
}

function Faq({ page }: SectionProps) {
  return (
    <section aria-labelledby="faq" className="prose">
      <h2 id="faq">Frequently asked questions</h2>
      <div className="faq">
        {page.content.faq.map((f, i) => (
          <details key={f.q} open={i === 0}>
            <summary><h3>{f.q}</h3><ChevronIcon size={18} className="faq-chevron" /></summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Related({ related }: SectionProps) {
  if (!related.length) return null;
  return (
    <nav aria-labelledby="related" className="prose">
      <h2 id="related">Related tools</h2>
      <ul className="related">
        {related.map((p) => <li key={p.slug}><Link href={pagePath(p)}>{p.content.h1}<ArrowRightIcon size={16} /></Link></li>)}
      </ul>
    </nav>
  );
}

export const SECTION_COMPONENTS: Record<ContentSection, ComponentType<SectionProps>> = {
  howTo: HowTo,
  examples: Examples,
  formula: Formula,
  faq: Faq,
  related: Related,
};
