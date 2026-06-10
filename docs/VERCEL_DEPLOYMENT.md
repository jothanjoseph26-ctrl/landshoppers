# Deploy on Vercel (recommended — low cost)

Run **web + API** on a single Vercel project. No ECS, Redis, or OpenSearch required for the core product.

## Architecture on Vercel

| Piece | Where it runs |
|-------|----------------|
| Next.js UI | Vercel |
| Hono API (`/v1/*`) | Same Vercel project at **`/api/*`** |
| PostgreSQL + PostGIS | [Neon](https://neon.tech) (free tier works for dev) |
| Background jobs | **Off** until you add Upstash + workers later |
| AI extraction / SEO workers | **Off** (no `REDIS_URL` / `AI_SERVICE_URL`) |
| Search | Postgres (`SEARCH_BACKEND=postgres`) |

## 1. Create Vercel project

1. Import `propertycitycomng-dotcom/landshoppers` on [vercel.com](https://vercel.com).
2. **Root directory:** repository root (uses root `vercel.json`).
3. Framework: **Next.js** (auto-detected).

Build settings (already in `vercel.json`):

- **Install:** `corepack enable && pnpm install --frozen-lockfile`
- **Build:** `pnpm --filter @landshoppers/db exec prisma generate && pnpm --filter @landshoppers/web build`
- **Output:** `apps/web/.next`

## 2. Environment variables (Vercel → Settings → Environment Variables)

### Required

| Variable | Example | Notes |
|----------|---------|--------|
| `DATABASE_URL` | Neon **pooled** URL | Runtime + Prisma |
| `DIRECT_URL` | Neon **direct** URL | Migrations only (optional on Vercel if you migrate from CI) |
| `JWT_SECRET` | long random string | Auth tokens |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Or custom domain |
| `NEXT_PUBLIC_SALES_WHATSAPP` | `2349125172692` | Sales WhatsApp |
| `SEARCH_BACKEND` | `postgres` | Skip OpenSearch |

### Same-origin API (recommended)

Leave **`NEXT_PUBLIC_API_URL` unset**. The web app auto-uses `https://<your-domain>/api` on Vercel.

Or set explicitly:

```bash
NEXT_PUBLIC_API_URL="https://your-app.vercel.app/api"
```

### Optional

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Maps |
| `NEXT_PUBLIC_PORTAL_GUARD` | `false` for now |
| `CORS_ORIGINS` | Custom domain if needed |
| `RESEND_API_KEY` | Email |
| `PAYSTACK_SECRET_KEY` | Payments |

### Leave empty on Vercel (saves cost)

- `REDIS_URL` — queues disabled; API still works
- `OPENSEARCH_URL` — use Postgres search
- `AI_SERVICE_URL` — AI worker features stay stubbed/disabled

## 3. Database migrations

Run from your machine or GitHub Actions CI (not on every Vercel build):

```bash
pnpm db:migrate
```

Or use Neon SQL editor after `prisma migrate deploy` in CI.

## 4. Verify deployment

- `https://<your-app>/api/health` → JSON health check  
- `https://<your-app>/api/v1/...` → API routes  
- Login / listings / portals should hit the same origin API  

## 5. Turn off AWS (stop billing)

1. **ECS:** set desired count **0** on all services, or delete cluster.  
2. **ElastiCache / OpenSearch:** delete if provisioned.  
3. **GitHub:** AWS deploy workflow is **manual only** (`workflow_dispatch`).  
4. Keep **Neon** (database) — that is separate from AWS ECS.

## What is degraded without workers

- WhatsApp listing extraction queue  
- SEO generation queue  
- OpenSearch indexing / saved-search alert emails  
- ServiceHub match score cron  

Core flows (auth, listings CRUD, portals, inquiries, settings) work on API + Postgres.

## Local dev (Vercel-style)

```bash
pnpm install
pnpm db:migrate
LANDSHOPPERS_API_SAME_ORIGIN=true NEXT_PUBLIC_APP_URL=http://localhost:3000 pnpm --filter @landshoppers/web dev
```

API is at `http://localhost:3000/api/v1/...` (no separate `:4001` process).

Or keep split dev: `pnpm dev` with `NEXT_PUBLIC_API_URL=http://localhost:4001`.

## When you have budget again

- **Workers:** Railway / Fly.io / small ECS + Upstash Redis  
- **Search:** OpenSearch or Typesense  
- **AI:** Railway for `apps/ai-service`  

See also [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for AWS path (paused).
