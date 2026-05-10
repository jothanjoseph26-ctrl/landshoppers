# LandShoppers

Monorepo for the LandShoppers marketplace (`apps/web`, `apps/api`, `packages/db`). Python AI service (`apps/ai-service`) exposes `/extract-listing` and `/generate-seo-variants`; BullMQ workers live under `apps/workers` and forward queue jobs to that service (`REDIS_URL`, `AI_SERVICE_URL`).

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9 (`packageManager` is pinned in root `package.json`)
- Python 3.12+ with `pip` for the FastAPI AI service
- Docker (for local Postgres/PostGIS, Redis, OpenSearch)

If Windows resolves `python` to a broken Microsoft Store alias, set `LANDSHOPPERS_PYTHON` to a working `python.exe`. The repo scripts also auto-detect common per-user Python installs under `%LOCALAPPDATA%\Programs\Python`.

## Environment

Copy `.env.example` to `.env` at the repository root. `packages/db` loads this path via `prisma.config.ts`.

## Local database

Start services:

```bash
pnpm docker:up
```

Apply migrations and generate the Prisma client:

```bash
pnpm db:migrate
pnpm db:generate
```

(Optional) Load seed data:

```bash
pnpm db:seed
```

Verify PostGIS (`postgis` extension, `geom` columns, GIST indexes):

```bash
pnpm db:verify:postgis
```

## Development

```bash
pnpm install
pnpm ai:install:dev
pnpm dev
```

Turbo runs workspace `dev` tasks (see root `package.json` / `turbo.json`).

### AI service (FastAPI)

From repo root, install the Python dependencies:

```bash
pnpm ai:install:dev
```

Run only the AI service:

```bash
pnpm --filter @landshoppers/ai-service dev
```

Contract JSON schemas: `apps/ai-service/schemas/json/` (regenerate with `pnpm --filter @landshoppers/ai-service run schemas:export`). Tests: `pnpm --filter @landshoppers/ai-service run test`.

### Background workers (BullMQ)

Requires Redis (`pnpm docker:up`). Start processors:

```bash
pnpm --filter @landshoppers/workers dev
```

## CI expectations

Pull requests run lint, `prisma migrate deploy`, PostGIS verification, Python AI pytest, and production builds. Use the same `DATABASE_URL` pattern as `.github/workflows/ci.yml` for automation parity. Set `JWT_SECRET` (see `.env.example`) so `@landshoppers/api` can issue tokens.

## Vercel deployment

Deploy the web app from the monorepo. The root `vercel.json` builds only `@landshoppers/web` and outputs `apps/web/.next`.

Recommended Vercel project settings:

- Framework preset: Next.js
- Install command: `corepack enable && pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @landshoppers/web build`
- Output directory: `apps/web/.next`

Set these environment variables in Vercel:

```bash
NEXT_PUBLIC_API_URL="https://<api-host>"
NEXT_PUBLIC_APP_URL="https://<vercel-app>"
NEXT_PUBLIC_PORTAL_GUARD="false"
```

The current Vercel deployment is web-only. `apps/api`, `apps/ai-service`, workers, PostGIS, Redis, and OpenSearch still need a separate production runtime before API-backed features can work in production.

## API auth (Week 2 slice)

After `pnpm db:seed`, demo accounts use password **`Password123!`** (see `packages/db/prisma/seed.ts`). Example:

```bash
curl -s -X POST http://localhost:4001/v1/auth/login -H "Content-Type: application/json" \
  -d "{\"email\":\"buyer@example.test\",\"password\":\"Password123!\"}"
```

Then `Authorization: Bearer <accessToken>` for `GET /v1/me` and `POST /v1/listings`.
