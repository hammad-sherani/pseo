import type { CSSProperties } from "react";

export interface ThemeTokens {
  /** Accent hues as [light, dark] pairs so one page works in both color schemes. */
  accent: [string, string];
  accent2: [string, string];
  accent3: [string, string];
  radius: string;
  font: "sans" | "serif" | "rounded";
  density: "cozy" | "compact";
}

export const THEMES: Record<string, ThemeTokens> = {
  ocean: { accent: ["#0b6bcb", "#5aa9f0"], accent2: ["#12a39a", "#4fd1c5"], accent3: ["#8fb8e6", "#2f4f73"], radius: "14px", font: "sans", density: "cozy" },
  forest: { accent: ["#2f7d4a", "#6cc68a"], accent2: ["#c08a1e", "#e7b955"], accent3: ["#a9d3b5", "#2c4a37"], radius: "6px", font: "serif", density: "cozy" },
  sunset: { accent: ["#d1491f", "#ff8a5c"], accent2: ["#7b3fbf", "#b48cf0"], accent3: ["#f3b39a", "#5c3226"], radius: "20px", font: "rounded", density: "cozy" },
  graphite: { accent: ["#22262e", "#e6e8ec"], accent2: ["#d4a017", "#f2c94c"], accent3: ["#9aa1ad", "#4a505c"], radius: "2px", font: "sans", density: "compact" },
  violet: { accent: ["#6b4ce6", "#a594ff"], accent2: ["#e0457b", "#ff7aa8"], accent3: ["#c6bbf7", "#3d3470"], radius: "10px", font: "rounded", density: "compact" },
};

export const THEME_KEYS = Object.keys(THEMES);

/** Inline CSS variables for the page wrapper: no per-theme stylesheet is shipped. */
export function themeStyle(key: string): CSSProperties {
  const t = THEMES[key] ?? THEMES.ocean;
  return {
    "--accent-l": t.accent[0], "--accent-d": t.accent[1],
    "--accent-2-l": t.accent2[0], "--accent-2-d": t.accent2[1],
    "--accent-3-l": t.accent3[0], "--accent-3-d": t.accent3[1],
    "--radius": t.radius,
    "--font-display": `var(--font-${t.font})`,
    "--gap": t.density === "compact" ? "12px" : "20px",
  } as CSSProperties;
}

/** localStorage key for the visitor's light/dark choice (ThemeToggle). */
export const THEME_KEY = "theme";

/**
 * Runs in <head> before first paint so a saved choice never flashes the
 * other theme. Without a saved choice the OS setting applies via CSS.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
