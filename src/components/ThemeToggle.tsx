"use client";
import { THEME_KEY } from "@/theme/themes";
import { MoonIcon, SunIcon } from "./icons";

/**
 * Light/dark switch. Both icons are rendered and CSS shows the right one, so
 * the server HTML matches whatever theme the browser ends up in.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const current = root.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked (private mode): the choice lasts for this page view.
    }
  };
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle dark mode" title="Toggle dark mode">
      <MoonIcon size={18} className="i-moon" />
      <SunIcon size={18} className="i-sun" />
    </button>
  );
}
