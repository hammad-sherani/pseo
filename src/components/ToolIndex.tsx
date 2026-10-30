"use client";
import { useState } from "react";
import Link from "next/link";
import type { Cluster } from "@/schemas/page";
import { ArrowRightIcon, INTENT_ICONS, SearchIcon } from "./icons";

export interface IndexItem {
  title: string;
  href: string;
  description: string;
  intent: Cluster["intent"];
  tags?: string[];
}

interface Props {
  items: IndexItem[];
  headingLevel: 2 | 3;
  /** Show a filter box above the list (hubs). */
  filterable?: boolean;
}

/** Row list of tools used by the home page and cluster hubs. */
export function ToolIndex({ items, headingLevel, filterable }: Props) {
  const [query, setQuery] = useState("");
  const H = `h${headingLevel}` as const;
  const q = query.trim().toLowerCase();
  const shown = q
    ? items.filter((i) => `${i.title} ${i.description} ${i.tags?.join(" ") ?? ""}`.toLowerCase().includes(q))
    : items;

  return (
    <div className="tool-index">
      {filterable && (
        <div className="index-toolbar">
          <label className="filter">
            <SearchIcon size={17} />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={`Filter ${items.length} tools`} aria-label="Filter tools" />
          </label>
          <span className="index-count" aria-live="polite">{q ? `${shown.length} of ${items.length}` : `${items.length} tools`}</span>
        </div>
      )}
      {shown.length ? (
        <ul className="tool-rows">
          {shown.map((it) => {
            const Icon = INTENT_ICONS[it.intent];
            return (
              <li key={it.href}>
                <Link href={it.href} className="tool-row">
                  <span className="row-icon"><Icon size={18} /></span>
                  <span className="row-body">
                    <H>{it.title}</H>
                    <p>{it.description}</p>
                    {it.tags && it.tags.length > 0 && (
                      <span className="row-tags">{it.tags.map((t) => <span key={t}>{t}</span>)}</span>
                    )}
                  </span>
                  <ArrowRightIcon size={18} className="row-arrow" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty-state">
          <span className="empty-icon"><SearchIcon size={22} /></span>
          <strong>No tools match “{query.trim()}”</strong>
          <p>Check the spelling or try a shorter term.</p>
          <button type="button" className="btn btn-quiet" onClick={() => setQuery("")}>Clear filter</button>
        </div>
      )}
    </div>
  );
}
