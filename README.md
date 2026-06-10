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

For Neon, set both database URLs:

- `DATABASE_URL`: pooled connection string for the API, workers, AI audit writes, and other runtime clients.
- `DIRECT_URL`: direct connection string for Prisma migrations and PostGIS extension setup.

Both Neon URLs should include `sslmode=require`, and `DIRECT_URL` should use the non-pooler host.

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

## Vercel deployment (recommended — web + API on one project)

**Full guide:** [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)

The Hono API is mounted at **`/api/*`** on the same Vercel deployment as Next.js (`apps/web/app/api/[[...path]]/route.ts`). Leave `NEXT_PUBLIC_API_URL` unset on Vercel to use same-origin `/api`.

### Vercel project settings

- **Root Directory:** `apps/web` (required — Next.js lives here, not repo root)
- Build/install: see `apps/web/vercel.json`

### Required env vars on Vercel

```bash
DATABASE_URL="postgresql://..."          # Neon pooled
DIRECT_URL="postgresql://..."            # Neon direct (migrations)
JWT_SECRET="..."
NEXT_PUBLIC_APP_URL="https://<your-app>.vercel.app"
SEARCH_BACKEND="postgres"
NEXT_PUBLIC_SALES_WHATSAPP="2349125172692"
```

Optional: `NEXT_PUBLIC_API_URL="https://<your-app>.vercel.app/api"` (auto-detected if omitted on Vercel).

### Not needed on Vercel (leave unset to avoid extra cost)

- `REDIS_URL`, `OPENSEARCH_URL`, `AI_SERVICE_URL` — background jobs and OpenSearch stay off; core app still runs.

AWS ECS deploy is **paused** (manual GitHub workflow only) until you have budget for workers/search again.

## API auth (Week 2 slice)

After `pnpm db:seed`, demo accounts use password **`Password123!`** (see `packages/db/prisma/seed.ts`). Example:

```bash
curl -s -X POST http://localhost:4001/v1/auth/login -H "Content-Type: application/json" \
  -d "{\"email\":\"buyer@example.test\",\"password\":\"Password123!\"}"
```

Then `Authorization: Bearer <accessToken>` for `GET /v1/me` and `POST /v1/listings`.
