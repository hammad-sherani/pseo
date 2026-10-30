import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Lets a second build or dev server run beside one already using .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default config;
