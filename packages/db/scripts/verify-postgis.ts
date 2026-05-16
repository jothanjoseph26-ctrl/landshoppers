/**
 * Verifies PostGIS extension and GIST indexes on geography columns after migrations.
 * Run: pnpm --filter @landshoppers/db run verify:postgis
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createPrismaClient } from "@landshoppers/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

const prisma = createPrismaClient();

async function main() {
  const ext = await prisma.$queryRaw<{ extname: string }[]>`
    SELECT extname FROM pg_extension WHERE extname = 'postgis'
  `;
  if (ext.length !== 1) {
    throw new Error("verify-postgis: postgis extension not installed");
  }

  const cols = await prisma.$queryRaw<{ table_name: string; column_name: string }[]>`
    SELECT table_name::text AS table_name, column_name::text AS column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('properties', 'developer_projects')
      AND column_name = 'geom'
  `;
  const keys = new Set(cols.map((r) => `${r.table_name}.${r.column_name}`));
  if (!keys.has("properties.geom") || !keys.has("developer_projects.geom")) {
    throw new Error(
      `verify-postgis: missing geom columns (have: ${[...keys].join(", ")})`,
    );
  }

  const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname::text AS indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN ('properties_geom_gix', 'developer_projects_geom_gix')
  `;
  const names = new Set(indexes.map((r) => r.indexname));
  if (!names.has("properties_geom_gix") || !names.has("developer_projects_geom_gix")) {
    throw new Error(
      `verify-postgis: missing GIST indexes (have: ${[...names].join(", ")})`,
    );
  }

  const [{ exists: providerGeom }] =
    await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'service_providers'
        AND c.column_name = 'geom'
    ) AS exists
  `;

  if (providerGeom) {
    const spIdx = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname::text AS indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'service_providers'
        AND indexname = 'service_providers_geom_gix'
    `;
    if (spIdx.length !== 1) {
      throw new Error(
        "verify-postgis: service_providers.geom exists but GIST index service_providers_geom_gix is missing",
      );
    }
  } else {
    console.warn(
      "verify-postgis: service_providers.geom not present yet — skipping ServiceHub provider geom gate (Agent 1 migration)",
    );
  }

  console.log(
    "verify-postgis: OK (postgis + listings/project geom + GIST; ServiceHub provider geom enforced when column exists)",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
