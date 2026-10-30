"use client";
import { useEffect, useState } from "react";
import { OPEN_SEARCH } from "./CommandMenu";
import { SearchIcon } from "./icons";

interface Props {
  variant: "field" | "hero" | "icon";
  label?: string;
}

/** Opens the CommandMenu. Rendered as a fake input or an icon button. */
export function SearchTrigger({ variant, label = "Search tools" }: Props) {
  // "Ctrl K" on the server; switched after hydration so the markup matches.
  const [mod, setMod] = useState("Ctrl");
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setMod("⌘");
  }, []);
  const open = () => window.dispatchEvent(new Event(OPEN_SEARCH));

  if (variant === "icon") {
    return <button type="button" className="icon-btn" aria-label={label} onClick={open}><SearchIcon size={19} /></button>;
  }
  return (
    <button type="button" className={`search-trigger search-${variant}`} onClick={open} aria-haspopup="dialog">
      <SearchIcon size={variant === "hero" ? 20 : 17} />
      <span>{label}</span>
      <kbd>{mod} K</kbd>
    </button>
  );
}
