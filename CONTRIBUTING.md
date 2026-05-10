# Contributing to LandShoppers

## Database schema & migrations (`@landshoppers/db`)

Per the project framework, **one owner** coordinates changes to Prisma so migrations stay linear and reviewable.

### Rules

1. **Do not merge conflicting migrations.** Always pull `main` / `develop` before creating a migration.
2. **Branch naming:** `schema/<short-topic>` (e.g. `schema/add-tour-notes`).
3. **Process**
   - Open an issue or Slack thread describing additive vs breaking DDL.
   - Edit `packages/db/prisma/schema.prisma` on your branch.
   - Run `pnpm db:migrate:dev` from the repo root (or `pnpm --filter @landshoppers/db exec prisma migrate dev --name <meaningful_name>`).
   - Commit both `schema.prisma` and `prisma/migrations/**`.
4. **PostGIS / raw SQL:** Geography columns and GIST indexes may live in SQL migrations (see `20260509120001_postgis_geom`). Coordinate with search/geo API owners before changing `geom`.
5. **Verify locally:** After migrate, run `pnpm db:verify:postgis` when changing location columns.

### Seeds

- **`pnpm db:seed`** — Framework baseline includes **8 properties with listings**, **6 agents**, **6 service providers** (plus demo buyer/developer/WhatsApp rows). Keep counts aligned unless PM signs off on a change request.
