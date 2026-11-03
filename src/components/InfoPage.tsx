import Link from "next/link";
import type { ReactNode } from "react";

/** Shell for the plain-text site pages (About, Contact, Privacy). */
export function InfoPage({ title, lede, updated, children }: { title: string; lede: string; updated?: string; children: ReactNode }) {
  return (
    <main className="info">
      <header className="hub-header">
        <div className="container">
          <nav aria-label="Breadcrumb" className="crumbs">
            <ol><li><Link href="/">Home</Link></li><li aria-current="page">{title}</li></ol>
          </nav>
          <h1>{title}</h1>
          <p className="lede">{lede}</p>
          {updated && <p className="info-updated">Last updated <time dateTime={updated}>{new Date(updated).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" })}</time></p>}
        </div>
      </header>
      <div className="container info-body">{children}</div>
    </main>
  );
}
