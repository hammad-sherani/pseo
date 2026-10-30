"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/lib/nav";
import { SearchTrigger } from "./SearchTrigger";
import { ThemeToggle } from "./ThemeToggle";
import { CloseIcon, GridIcon, INTENT_ICONS, LockIcon, LogoMark, MenuIcon } from "./icons";

interface Props {
  siteName: string;
  groups: NavGroup[];
  total: number;
}

/**
 * App chrome: a persistent sidebar on desktop that becomes a drawer behind a
 * top bar on smaller screens. Marks the current hub and tool.
 */
export function SiteChrome({ siteName, groups, total }: Props) {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = (href: string) => (path === href ? "page" : undefined);
  const brand = <Link href="/" className="brand"><LogoMark size={28} /><span>{siteName}</span></Link>;

  return (
    <>
      <header className="topbar">
        <button type="button" className="icon-btn" aria-label="Open navigation" aria-expanded={open} aria-controls="sidebar"
          onClick={() => setOpen(true)}><MenuIcon size={20} /></button>
        {brand}
        <div className="topbar-actions">
          <SearchTrigger variant="icon" />
          <ThemeToggle />
        </div>
      </header>
      <div className="scrim" data-open={open || undefined} onClick={() => setOpen(false)} aria-hidden />

      <aside id="sidebar" className="sidebar" data-open={open || undefined}>
        <div className="sidebar-head">
          {brand}
          <button type="button" className="icon-btn sidebar-close" aria-label="Close navigation" onClick={() => setOpen(false)}>
            <CloseIcon size={20} />
          </button>
        </div>
        <SearchTrigger variant="field" />

        <nav aria-label="Tools" className="side-nav">
          <Link href="/" className="side-link" aria-current={current("/")}>
            <GridIcon size={18} /><span>Overview</span><span className="side-count">{total}</span>
          </Link>
          {groups.map((g) => {
            const Icon = INTENT_ICONS[g.intent];
            const inGroup = path === `/${g.slug}` || path.startsWith(`/${g.slug}/`);
            return (
              <div key={g.slug} className="side-group" data-active={inGroup || undefined}>
                <Link href={`/${g.slug}`} className="side-link" aria-current={current(`/${g.slug}`)}>
                  <Icon size={18} /><span>{g.name}</span><span className="side-count">{g.count}</span>
                </Link>
                <ul>
                  {g.tools.map((t) => (
                    <li key={t.href}><Link href={t.href} title={t.title} aria-current={current(t.href)}>{t.short}</Link></li>
                  ))}
                  {g.count > g.tools.length && (
                    <li><Link href={`/${g.slug}`} className="side-more">All {g.count} tools</Link></li>
                  )}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <span><LockIcon size={15} />Runs in your browser</span>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
