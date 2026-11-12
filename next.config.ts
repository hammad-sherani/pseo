import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Lets a second build or dev server run beside one already using .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Next starts one build worker per logical CPU; on many-core machines with little
  // free commit memory that crashes with "Zone Allocation failed". 4 is plenty here.
  experimental: { cpus: 4 },
};

export default config;
