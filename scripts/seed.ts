// Writes the assembled seed pages into Postgres.
// Usage: DATABASE_URL=... npm run db:push && DATABASE_URL=... npm run db:seed
import { CLUSTERS, PAGE_SPECS } from "../src/db/seed-specs";
import { assemblePages } from "../src/lib/assemble";
import { writePages } from "./db-write";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const pages = assemblePages(PAGE_SPECS);
await writePages(url, pages, PAGE_SPECS);
console.log(`Seeded ${pages.length} pages in ${CLUSTERS.length} clusters.`);
