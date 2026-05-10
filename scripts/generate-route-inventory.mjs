/**
 * Writes `docs/WEB_ROUTE_INVENTORY.md` from `apps/web/app` page files.
 * Run from repo root: `pnpm run routes:inventory`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const appDir = path.join(root, "apps", "web", "app");
const outFile = path.join(root, "docs", "WEB_ROUTE_INVENTORY.md");

function isRouteGroup(name) {
  return name.startsWith("(") && name.endsWith(")");
}

function segmentToRoute(seg) {
  if (seg.startsWith("[...")) return "[...]";
  return seg;
}

function pagePathToRoute(dir) {
  const rel = path.relative(appDir, dir).replace(/\\/g, "/");
  if (!rel || rel === ".") return "/";
  const segments = rel
    .split("/")
    .filter(Boolean)
    .filter((s) => !isRouteGroup(s));
  const urlSegments = segments.map(segmentToRoute);
  return `/${urlSegments.join("/")}`;
}

const routes = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.name === "page.tsx" || ent.name === "page.ts") {
      routes.push({
        route: pagePathToRoute(path.dirname(full)),
        file: path.relative(root, full).replace(/\\/g, "/"),
      });
    }
  }
}

walk(appDir);
routes.sort((a, b) => a.route.localeCompare(b.route) || a.file.localeCompare(b.file));

const body = [
  "# LandShoppers web route inventory",
  "",
  `Generated on ${new Date().toISOString().slice(0, 10)}. Regenerate: \`pnpm run routes:inventory\` (repo root).`,
  "",
  "These URLs correspond to App Router `page.tsx` / `page.ts` files under `apps/web/app`.",
  "Parentheses folders `(name)` are route groups and do not appear in the URL. A `[...]` segment is a catch-all route.",
  "",
  "| URL | File |",
  "| --- | ---- |",
  ...routes.map((r) => `| \`${r.route}\` | \`${r.file}\` |`),
  "",
].join("\n");

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, body, "utf8");
console.log(`wrote ${path.relative(root, outFile)} (${routes.length} routes)`);
