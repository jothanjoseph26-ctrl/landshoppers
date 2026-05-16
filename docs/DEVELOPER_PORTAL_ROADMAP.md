# Developer (Estate Owner) Portal — Roadmap & Agent Handoff

**Purpose**: Single source of truth so parallel agents (API, web, workers, AI, QA) ship the same vision without duplicating discovery work.  
**Stack**: Turborepo, Next 16, React 19, Tailwind 4, Radix, Hono (`apps/api`), Prisma (`packages/db`), OpenSearch, workers.  
**Vision doc**: Command-center dashboard, Nigerian market context, bounded AI, WhatsApp-first—see prior product narrative in chat / `LandShoppers_Project_Framework_v1.1.md` (DEV-01–DEV-10).  
**Related roadmap**: Property **agent** portal (AgentOS) — phased plan and five-stream ownership: [`docs/AGENT_PORTAL_ROADMAP.md`](./AGENT_PORTAL_ROADMAP.md) (AGT-01–AGT-12).

**Last updated**: 2026-05-13 (Phase C: digest email `POST …/leads/digest/email` + Resend / log-only)

---

## 1. Current implementation status (executed in repo)

| Deliverable | Status | Location / notes |
|-------------|--------|------------------|
| **Roadmap doc** | Done | `docs/DEVELOPER_PORTAL_ROADMAP.md` (this file) |
| **Authenticated developer APIs** | Done (Phase A slice) | `GET/PATCH/POST` under `/v1/me/developer/*` — see §3 |
| **Web client helpers** | Done | `apps/web/lib/api/developer-portal.ts` |
| **Real routes (replace catch-all for core flows)** | Done | `projects/new`, `projects/[id]`, `bulk-upload`, `analytics`, `kyc`, `team`, `subscription`, `settings`; catch-all only for unknown nested paths. |
| **Projects list wired to API** | Done | `apps/web/app/(dashboard)/developer/projects/page.tsx` — SWR + bearer token; no mock grid when signed out |
| **Developer home dashboard** | Done | `apps/web/app/(dashboard)/developer/page.tsx` — `GET /v1/me/developer/dashboard` + inquiries preview; `MarketListingsStat` unchanged. **Layout** (`layout.tsx`) uses the same dashboard payload for **company name** and **user** line (no stock photos / placeholder names). |
| **Developer leads page** | Done | `apps/web/app/(dashboard)/developer/leads/page.tsx` — inquiries + digest + pitch draft + **Email digest** (`POST …/leads/digest/email`) |
| **DB seed (developer portfolio)** | Done | `packages/db/prisma/seed.ts` — **8** `DeveloperProject` rows (owner: `SEED_DEVELOPER_EMAIL` in root `.env`, default `developer@example.test`), 2 sample units each, **16** inquiries, `Developer` totals synced |
| **Bulk upload (CSV → `ProjectUnit`)** | Done (MVP) | `POST/GET/PATCH/…/commit` under `/v1/me/developer/bulk-uploads`; web `apps/web/app/(dashboard)/developer/bulk-upload/page.tsx`; migration `20260513120000_developer_bulk_uploads`; presign returns 501 until S3. |
| **Analytics (leads + inventory KPIs)** | Done (MVP) | `GET /v1/me/developer/analytics/summary` (`period`, optional `projectIds`); web `apps/web/app/(dashboard)/developer/analytics/page.tsx` (Recharts); `revenueNgN` / `conversionRate` null until payments + funnel exist. |
| **KYC documents (developer portal)** | Done (MVP) | `GET/POST/PATCH` under `/v1/me/developer/kyc/documents`; web `apps/web/app/(dashboard)/developer/kyc/page.tsx`; migration `20260513140000_developer_kyc_documents`; **HTTPS `externalUrl`** until S3; `POST …/presign` → **501**. |
| **Team (members, invites, activity)** | Done (MVP) | `GET/PATCH` `/team/members`, `GET/POST/DELETE` `/team/invites`, `GET /team/activity`; web `/developer/team`; migration `20260513160000_developer_team_portal`; optional header **`X-Portal-Developer-Id`** for staff who also own a `Developer` row; invite response includes one-time **`acceptToken`** / `acceptPath`. |
| **Subscription & billing (developer portal)** | Done (MVP) | `GET /subscription`, `GET /subscription/invoices` (empty until `Payment` links `developerId`), `POST /subscription/checkout` (stub URL when **both** `PAYSTACK_PUBLIC_KEY` + `PAYSTACK_SECRET_KEY` set; else **503**); web `/developer/subscription`; `.env.example` documents Paystack vars. |
| **Organisation settings** | Done (MVP) | `GET/PATCH /settings` (developer company profile + sign-in email read-only); web `/developer/settings`; contract `developer-settings.ts`. |

---

## 2. Agent roles & ownership (suggested)

| Agent / stream | Owns | Reads |
|----------------|------|-------|
| **API (Hono)** | `/v1/me/developer/*`, contracts, serializers, RBAC, Prisma queries | This doc §3–4, `apps/api/src/routes/v1/me.*.ts` patterns |
| **Web (Next)** | Portal pages, SWR/data hooks, forms, empty states | `apps/web/lib/api/*`, `components/ui/*` |
| **Workers** | Digests, PDF generation, OpenSearch scoring, AI jobs | `apps/workers`, `packages/db` job tables when added |
| **AI** | Bounded endpoints, confidence, approval queues, audit logs | Schema `AiRequest` / audit patterns in gap plan |
| **QA / E2E** | Playwright for happy paths per phase | `apps/web/e2e/*`, `apps/api/tests/*` |

**Merge discipline**: Every PR that adds an API field updates **Zod contracts** + **web types** (or generated OpenAPI later).

---

## 3. API contract (Phase A — landed)

Base path: **`/v1/me/developer`** (requires `Authorization: Bearer` + `role: developer`).

| Method | Path | Description |
|--------|------|--------------|
| `GET` | `/dashboard` | Aggregates: `companyName`, `userEmail`, `displayName` (from profile), `projectCount`, inquiry counts by status, units sold sum, `recentProjects` (up to 5). |
| `GET` | `/projects` | Paginated list (`page`, `pageSize`, optional `status`). |
| `POST` | `/projects` | Create project (name, propertyType, city, state, optional fields). Server assigns `slug`. |
| `GET` | `/projects/:id` | Detail for one project **if** `developerId` matches authenticated developer. |
| `PATCH` | `/projects/:id` | Partial update (same ownership rule). |
| `GET` | `/inquiries` | Inquiries whose `projectId` belongs to this developer’s projects. |
| `GET` | `/leads/digest` | Period snapshot: totals, by-project counts, top “hot” inquiries (heuristic scoring). |
| `POST` | `/leads/digest/email` | Email that digest to the signed-in user (`RESEND_API_KEY` + `RESEND_FROM` / `EMAIL_FROM`); otherwise **log-only** (200, `emailed: false`). Rate-limited (8/hour per user). |
| `POST` | `/inquiries/:id/pitch-draft` | **Template** email draft for an owned inquiry (sync); queue + AI + audit is a later increment. |
| `GET` | `/bulk-uploads` | Paginated bulk upload history (`page`, `pageSize`). |
| `POST` | `/bulk-uploads` | Body: `projectId`, `filename`, `csvText` — parse + validate rows (MVP; max 2000 data rows). |
| `POST` | `/bulk-uploads/presign` | Returns **501** until S3 is wired. |
| `GET` | `/bulk-uploads/:id` | Upload detail + row stats. |
| `PATCH` | `/bulk-uploads/:id/mapping` | Partial `columnMap` update; re-validates from stored `parsedGrid`. |
| `GET` | `/bulk-uploads/:id/rows` | Paginated validation rows. |
| `POST` | `/bulk-uploads/:id/commit` | Body: `mode` `draft` \| `publish` — `publish` inserts `ProjectUnit` rows when status is `ready`. |
| `GET` | `/analytics/summary` | Query: `period` `week` \| `month` \| `quarter` \| `all`, optional repeated `projectIds` (owned projects only). KPIs + `inquiriesByDay` + `inquiriesByStatus` + `byProject` (cap 12) + static `insights`. |
| `GET` | `/kyc/documents` | Paginated list + `meta.countsByStatus`; filters `projectId`, `status`. |
| `POST` | `/kyc/documents/presign` | **501** until S3. |
| `POST` | `/kyc/documents` | Register metadata + **HTTPS** `externalUrl` (PDF / image MIME allowlist). |
| `GET` | `/kyc/documents/:id` | Detail + `previewUrl` (same as `externalUrl` in MVP). |
| `PATCH` | `/kyc/documents/:id` | `pending` only: `title`, `expiresAt`, `externalUrl`. |
| `GET` | `/team/members` | Members + owner; `meta.portalAdmin`, `meta.developerId`. Optional `X-Portal-Developer-Id` for cross-org context. |
| `PATCH` | `/team/members/:userId` | **Portal admin** only: `role`, `isDisabled`. Owner row is protected (`OWNER_PROTECTED`). |
| `GET` | `/team/invites` | Active (non-revoked, unexpired) invites. |
| `POST` | `/team/invites` | **Portal admin** only: `email`, `role`, optional `projectIds[]`. Returns `acceptToken` once. |
| `DELETE` | `/team/invites/:id` | **Portal admin** only: revoke. |
| `GET` | `/team/activity` | Paginated audit subset (`developer.team.*` actions for this developer). |
| `GET` | `/subscription` | Current `Subscription` row (if any), usage (`projectCount`, `listedUnits`, `inquiriesThisMonth`, `aiCreditsRemaining: null`), `limits` placeholders, `paystackConfigured`. |
| `GET` | `/subscription/invoices` | Paginated; **empty** until developer-scoped payments exist in schema. |
| `POST` | `/subscription/checkout` | Body: `plan` `developer_basic` \| `developer_pro`. **503** if Paystack keys incomplete; else stub **`authorizationUrl`** + `reference`. |
| `GET` | `/settings` | Organisation profile + `email` (from `User`). |
| `PATCH` | `/settings` | Partial update: `companyName`, `rcNumber`, company address/contact/website, `description` (see `developer-settings` contract). |

**Source files**

- Routes: `apps/api/src/routes/v1/me.developer.ts`, `apps/api/src/routes/v1/me.developer.bulk-upload.ts`, `apps/api/src/routes/v1/me.developer.analytics.ts`, `apps/api/src/routes/v1/me.developer.kyc.ts`, `apps/api/src/routes/v1/me.developer.team.ts`, `apps/api/src/routes/v1/me.developer.subscription.ts`, `apps/api/src/routes/v1/me.developer.settings.ts`
- Contracts: `apps/api/src/contracts/developer-portal.ts`, `apps/api/src/contracts/developer-bulk-upload.ts`, `apps/api/src/contracts/developer-analytics.ts`, `apps/api/src/contracts/developer-kyc.ts`, `apps/api/src/contracts/developer-team.ts`, `apps/api/src/contracts/developer-subscription.ts`, `apps/api/src/contracts/developer-settings.ts`
- Serializer: `apps/api/src/lib/serialize/developer-project.ts`
- Mount: `apps/api/src/routes/v1/me.ts` → `meV1.route("/developer", meDeveloperV1)`

**Tests**: `apps/api/tests/developer-portal.test.ts`, `apps/api/tests/developer-bulk-upload.test.ts`, `apps/api/tests/developer-analytics.test.ts`, `apps/api/tests/developer-kyc.test.ts`, `apps/api/tests/developer-team.test.ts`, `apps/api/tests/developer-subscription.test.ts`, `apps/api/tests/developer-settings.test.ts` (Vitest + in-memory Prisma fake).

---

## 4. Build phases (remaining work)

### Phase A2 — Shell & navigation

- [ ] Design tokens / shared `PortalPageHeader` (title, actions, breadcrumbs).
- [ ] Command palette (`cmdk`) global entry; first commands: “New project”, “Search projects”.
- [x] Remove or narrow `[...slug]` as each route gains a real `page.tsx`. (Catch-all remains for unknown nested paths only; core routes are explicit.)

### Phase B — Dashboard home (API-backed)

- [x] Replace mock cards on `apps/web/app/(dashboard)/developer/page.tsx` with `GET /v1/me/developer/dashboard` + existing `MarketListingsStat` + recent inquiries preview.
- [ ] Pipeline funnel when tour/booking models are linked to developer projects (schema review first).

### Phase C — Lead engine (MVP)

- [x] **Leads inbox**: `/developer/leads` uses `GET /v1/me/developer/inquiries` + project filter (no mock table when signed in).
- [x] **`GET /v1/me/developer/leads/digest`**: API + web digest card (period selector, by-project, hot leads).
- [x] **`POST /v1/me/developer/inquiries/:id/pitch-draft`**: synchronous **template** draft in API + “Generate pitch draft” on leads row menu.
- [ ] Worker + OpenSearch: score buyers (saved searches, inquiries, views) vs project geo/price band.
- [x] **Digest email**: `POST /v1/me/developer/leads/digest/email` (Resend or log-only) + **Email digest** on `/developer/leads`.
- [ ] Digest **cron** (weekly automation; optional repeat of same payload as manual send).
- [ ] Pitch-draft → **queue** → **real AI** → persistence (`AiRequestLog` / `AuditLog`) + approval UX.

### Phase D — Bulk upload, analytics, KYC, subscription, team

- [x] Real page `/developer/bulk-upload` (CSV `csvText` API; S3 presign later).
- [x] Real page `/developer/analytics` (`GET …/analytics/summary`; Recharts).
- [x] Real page `/developer/kyc` (HTTPS `externalUrl` MVP; presign 501).
- [x] Real page `/developer/team` (members, invites, activity; `X-Portal-Developer-Id` for multi-org staff on team routes).
- [x] Real page `/developer/subscription` (plan + usage + tier cards; checkout stub; invoices empty).
- [x] Real page `/developer/settings` (organisation profile; `GET/PATCH /v1/me/developer/settings`).
- [ ] Paystack milestones, document AI extraction—**separate specs** per page to avoid scope coupling.

---

## 5. Web file map (developer portal)

| Route | File |
|-------|------|
| `/developer` | `apps/web/app/(dashboard)/developer/page.tsx` |
| `/developer/projects` | `apps/web/app/(dashboard)/developer/projects/page.tsx` |
| `/developer/projects/new` | `apps/web/app/(dashboard)/developer/projects/new/page.tsx` |
| `/developer/projects/[id]` | `apps/web/app/(dashboard)/developer/projects/[id]/page.tsx` |
| `/developer/leads` | `apps/web/app/(dashboard)/developer/leads/page.tsx` |
| `/developer/bulk-upload` | `apps/web/app/(dashboard)/developer/bulk-upload/page.tsx` |
| `/developer/analytics` | `apps/web/app/(dashboard)/developer/analytics/page.tsx` |
| `/developer/kyc` | `apps/web/app/(dashboard)/developer/kyc/page.tsx` |
| `/developer/team` | `apps/web/app/(dashboard)/developer/team/page.tsx` |
| `/developer/subscription` | `apps/web/app/(dashboard)/developer/subscription/page.tsx` |
| `/developer/settings` | `apps/web/app/(dashboard)/developer/settings/page.tsx` |
| Catch-all (unknown nested paths) | `apps/web/app/(dashboard)/developer/[...slug]/page.tsx` |
| Layout / nav | `apps/web/app/(dashboard)/developer/layout.tsx` |

**Client API**: `apps/web/lib/api/developer-portal.ts`

---

## 6. Database touchpoints

- `Developer` / `DeveloperProject` / `Inquiry` (`projectId`) / `DeveloperBulkUpload` + rows / `ProjectUnit` / **`DeveloperKycDocument`** / **`DeveloperMembership`** / **`DeveloperInvite`** — see `packages/db/prisma/schema.prisma`.
- Public catalog remains `GET /v1/projects/:id` and `GET /v1/developers` — do not confuse with authenticated `me/developer` routes.
- **Demo data**: run `pnpm db:seed` from repo root (requires `DATABASE_URL`). Set `SEED_DEVELOPER_EMAIL` (and optional `SEED_DEVELOPER_COMPANY_NAME`) in `.env` so that user owns the eight projects; default demo login remains **`developer@example.test`** / `Password123!` (password is only auto-reset for `@example.test` addresses).

---

## 7. Definition of Done (per slice)

1. API: Zod-validated input, `ApiError` codes, ownership checks on every `:id` route.
2. Web: Loading / empty / error states; no silent fallback to mock data when session has a token.
3. Tests: New Vitest coverage for new endpoints; extend fake Prisma in `apps/api/tests/helpers/fake-prisma.ts` when adding queries/includes.
4. Docs: Update §1 table in this file when a slice merges.

---

## 8. Open decisions (need product owner)

- Default **verification** gate: can unverified developers create draft-only projects vs live catalog?
- **Team members** model vs `User` invites for sales reps on a project.
- **Investor portal** white-label: subdomain vs embed snippet.

---

## 9. Quick links

- **Ordered slice specs** (Bulk Upload → Analytics → KYC → Team → Subscription): `docs/DEVELOPER_PORTAL_SLICE_SPECS.md`
- Framework inventory: `LandShoppers_Project_Framework_v1.1.md` (Developer portal DEV-01–DEV-10).
- Gap / supervision context: `GAP_CLOSURE_5_AGENT_SUPERVISION_PLAN.md`.
- Web routes script: `pnpm routes:inventory` → `docs/WEB_ROUTE_INVENTORY.md` (regenerate after route changes).
