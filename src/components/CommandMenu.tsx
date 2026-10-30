"use client";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { SearchItem } from "@/lib/nav";
import { ArrowRightIcon, INTENT_ICONS, SearchIcon } from "./icons";

/** Window event that opens the palette (SearchTrigger dispatches it). */
export const OPEN_SEARCH = "toolhaus:open-search";

const MAX_RESULTS = 8;

/** Ctrl/⌘K tool search over the site index. */
export function CommandMenu({ items }: { items: SearchItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();

  const index = useMemo(() => items.map((i) => ({ item: i, text: `${i.title} ${i.group} ${i.keywords}`.toLowerCase() })), [items]);
  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return index.filter((e) => terms.every((t) => e.text.includes(t))).slice(0, MAX_RESULTS).map((e) => e.item);
  }, [index, query]);

  useEffect(() => {
    const open = () => {
      setQuery("");
      setActive(0);
      if (!dialog.current?.open) dialog.current?.showModal();
      input.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener(OPEN_SEARCH, open);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_SEARCH, open);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const go = (item: SearchItem | undefined) => {
    if (!item) return;
    dialog.current?.close();
    router.push(item.href);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const d = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (results.length ? (a + d + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    // Clicking the backdrop lands on the <dialog> itself, outside the panel.
    <dialog ref={dialog} className="cmdk" aria-label="Search tools" onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
      <div className="cmdk-panel">
        <div className="cmdk-input">
          <SearchIcon size={20} />
          <input ref={input} value={query} placeholder="Search calculators, converters, text tools…" role="combobox"
            aria-expanded="true" aria-controls="cmdk-list" aria-activedescendant={results.length ? `cmdk-${active}` : undefined}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKeyDown} />
          <kbd>Esc</kbd>
        </div>
        <p className="cmdk-label">{query ? `${results.length} ${results.length === 1 ? "match" : "matches"}` : "Popular tools"}</p>
        {results.length ? (
          <ul id="cmdk-list" role="listbox" aria-label="Tools">
            {results.map((r, i) => {
              const Icon = INTENT_ICONS[r.intent];
              return (
                <li key={r.href} id={`cmdk-${i}`} role="option" aria-selected={i === active}
                  onMouseMove={() => setActive(i)} onClick={() => go(r)}>
                  <span className="cmdk-icon"><Icon size={17} /></span>
                  <span className="cmdk-title">{r.title}</span>
                  <small>{r.group}</small>
                  <ArrowRightIcon size={16} className="cmdk-go" />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="cmdk-empty">
            <strong>No tools match “{query}”</strong>
            <span>Try a unit such as “kg”, or a loan type such as “auto”.</span>
          </div>
        )}
        <div className="cmdk-foot" aria-hidden>
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> open</span>
        </div>
      </div>
    </dialog>
  );
}
