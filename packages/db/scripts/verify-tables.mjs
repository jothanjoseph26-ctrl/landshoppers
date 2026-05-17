import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: resolve(root, ".env") });

const EXPECTED = [
  "users",
  "user_profiles",
  "agents",
  "developers",
  "developer_memberships",
  "developer_invites",
  "developer_team_members",
  "developer_kyc_documents",
  "developer_projects",
  "developer_bulk_uploads",
  "developer_bulk_upload_rows",
  "project_units",
  "properties",
  "listings",
  "listing_images",
  "listing_features",
  "listing_price_history",
  "saved_searches",
  "saved_listings",
  "listing_recent_views",
  "notifications",
  "inquiries",
  "tour_requests",
  "messages",
  "reviews",
  "subscriptions",
  "payments",
  "service_providers",
  "service_leads",
  "service_bundles",
  "bundle_activations",
  "service_reviews",
  "provider_whatsapp_connections",
  "provider_availability",
  "provider_ai_match_log",
  "agent_preferred_partners",
  "raw_whatsapp_messages",
  "whatsapp_groups",
  "listing_seo_variants",
  "seo_posting_schedule",
  "ai_request_log",
  "audit_log",
  "platform_settings",
  "_prisma_migrations",
];

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("verify-tables: DATABASE_URL or DIRECT_URL required");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
const { rows } = await client.query(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
);
await client.end();

const actual = new Set(rows.map((r) => r.tablename));
const missing = EXPECTED.filter((t) => !actual.has(t));
const extra = [...actual].filter((t) => !EXPECTED.includes(t) && !t.startsWith("pg_"));

console.log(`Tables in DB: ${actual.size}`);
if (missing.length) {
  console.log("\nMissing expected tables:");
  for (const t of missing) console.log(`  - ${t}`);
}
if (extra.length) {
  console.log("\nExtra tables (not in checklist):");
  for (const t of extra) console.log(`  - ${t}`);
}
if (!missing.length) {
  console.log("\nAll expected Prisma tables exist.");
}
process.exit(missing.length ? 1 : 0);
