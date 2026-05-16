# Developer portal — slice specs (priority order)

**Purpose**: One-page-style specs per surface so API, web, workers, and AI ship in parallel without re-negotiating scope.  
**Order** (product): 1 Bulk Upload → 2 Analytics → 3 KYC & Verification → 4 Team Settings → 5 Subscription.  
**Stack alignment**: Next app routes under `apps/web/app/(dashboard)/developer/`, Hono `apps/api/src/routes/v1/me.developer.ts`, Zod in `apps/api/src/contracts/developer-portal.ts` (extend or add sibling contract files), client `apps/web/lib/api/developer-portal.ts`, upload security `docs/UPLOAD_VALIDATION_PLAN.md`.

**Global DoD** (from `DEVELOPER_PORTAL_ROADMAP.md`): Zod + `ApiError` + ownership on every `:id`; web loading/empty/error, no mock data when authed; Vitest + fake Prisma updates; replace catch-all `apps/web/app/(dashboard)/developer/[...slug]/page.tsx` coverage as each real `page.tsx` lands.

**Design tokens (all slices)**: Prefer semantic Tailwind/shadcn tokens already used in `developer/layout.tsx`: `bg-muted/30`, `bg-background`, `text-foreground`, `text-muted-foreground`, `border`, `bg-primary` / `text-primary-foreground` for active nav. **Compact density**: `text-sm`, tighter `gap-*` / `py-*` on tables and toolbars; use `components/ui/*` (Button, Badge, Table, Sheet/Drawer, Tabs). **Command palette** (`cmdk`): register slice-specific commands when each route ships (Phase A2 shell can stub global commands first).

---

## Slice 1 — Bulk Upload

**Route**: `/developer/bulk-upload`  
**File**: `apps/web/app/(dashboard)/developer/bulk-upload/page.tsx` (+ optional `loading.tsx`, `error.tsx`).

### Goal

Let an authenticated developer attach structured inventory (plots/phases/units) to an **existing** `DeveloperProject` in minutes, with validation before publish.

### MVP scope (ship first)

- Tabular source: **CSV + one Excel template** (single sheet). No PDF/image survey ingestion in MVP.
- **Target project** selector (required): `GET /v1/me/developer/projects` (existing).
- Flow: upload file → **column mapping** (manual + suggested matches) → **validation grid** (inline errors) → **Save draft** / **Publish** (creates or updates child rows per product decision).
- **Job progress**: async parse + validate + commit; UI polls job status or uses SSE later.

### Post-MVP (document in backlog, not blocking slice 1 merge)

- Multi-file drag-drop (PDFs, images); worker pipeline + Sharp where images matter.
- AI column detection with confidence + “review uncertain columns.”
- AI enrichment (descriptions, SEO titles, pricing hints) behind approval queue + audit log.
- “Match with existing projects” dedupe wizard.

### UI layout

- **Header**: title, primary actions (“Download sample CSV”, “New upload”).
- **Main**: stepper or clear sections — Drop zone → Mapping → Grid (TanStack Table: sort, filter, bulk select) → Preview counts (valid / invalid / warnings).
- **Left rail (optional MVP)**: “Templates” + “Recent uploads” list from `GET …/bulk-uploads`.
- **Right drawer (post-MVP)**: AI suggestions; omit in MVP or show static tips.

### API (new, all under `/v1/me/developer`, bearer + developer role)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/bulk-uploads` | Paginated history: id, `projectId`, filename, status, createdAt, rowCounts. |
| `POST` | `/bulk-uploads` | Create job: `projectId`, optional `fileKey` after client upload, or multipart if you centralize small files. Returns `{ uploadId, jobId }`. |
| `POST` | `/bulk-uploads/presign` | Body: `mime`, `byteSize`, `purpose=bulk_inventory`. Returns presigned PUT + `fileKey`. |
| `GET` | `/bulk-uploads/:id` | Job detail: status, phase (`mapping` / `validating` / `ready` / `committed` / `failed`), parsed headers sample, error summary. |
| `PATCH` | `/bulk-uploads/:id/mapping` | Body: `{ columnMap: Record<systemField, csvHeader> }`. Ownership: upload.developerId. |
| `GET` | `/bulk-uploads/:id/rows` | Paginated validation rows (cursor or page): rowIndex, payload, `errors[]`, `warnings[]`. |
| `POST` | `/bulk-uploads/:id/commit` | Body: `{ mode: "draft" \| "publish" }`. Idempotent guard; worker executes commit. |

**Zod**: new `developer-bulk-upload.ts` contracts; strict enums for `mode`, job `status`, `mime` allowlist (CSV + XLSX MIME per server validation).

### Data / workers

- New tables (example names): `DeveloperBulkUpload`, `DeveloperBulkUploadRow` (or store row blobs in object storage for scale).  
- Worker: download from private bucket → parse → validate against Prisma models (whatever represents “unit/plot” when schema exists; until then, validate into staging JSON and **no public catalog mutation**).  
- Apply `UPLOAD_VALIDATION_PLAN.md`: magic-byte check, max size, `FILE_TOO_LARGE` / `UNSUPPORTED_TYPE` stable codes.

### Acceptance criteria

- Unauthenticated → 401; non-developer → 403.
- Cannot set mapping or commit for another developer’s `projectId`.
- Grid shows all validation errors before commit enabled; “Publish” blocked if any hard error.
- After successful commit, project detail or list reflects new counts (define which counters when unit model exists).
- Vitest: happy path + ownership violation + invalid mapping.

### Command palette (examples)

- “Bulk upload inventory”
- “Download bulk upload template”

---

## Slice 2 — Analytics

**Route**: `/developer/analytics`  
**File**: `apps/web/app/(dashboard)/developer/analytics/page.tsx`.

### Goal

Actionable sales and lead intelligence for **owned projects only**, filterable by project and date range.

### MVP scope

- **KPI strip** (4–6 metrics) backed by one aggregate endpoint: revenue (if payment data linked), units sold / listed, inquiries total, conversion placeholder if funnel not wired — use `null` + tooltips for “coming soon” rather than fake numbers.
- **Charts**: 2 charts MVP — (1) inquiries or leads over time, (2) simple funnel or status breakdown using existing `InquiryStatus` aggregates.
- Filters: project multi-select, period (`week` | `month` | `quarter` | `all`) aligned with digest patterns.

### Post-MVP

- Geo heatmap (PostGIS + OpenSearch), competitor benchmark, AI NLQ (“Why is Phase 2 slower?”), custom PDF report builder, export Excel.

### API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/analytics/summary` | Query: `period`, optional `projectIds[]`. Returns KPIs + chart series + metadata (`generatedAt`, `currency: NGN`). |
| `GET` | `/analytics/funnel` | Optional second endpoint if payload size warrants split; else fold into `summary`. |

Serializer must never leak other developers’ projects. Cache-friendly JSON; TanStack Query on web with `staleTime` tuned for dashboards.

### UI

- Server Component wrapper optional; charts in client boundary (Recharts or Tremor — pick one per repo standard when implementing).
- Right **collapsible** “Insights” panel: MVP static tips from server (`string[]`); later swap for AI blocks with citations.

### Acceptance criteria

- Empty developer (no projects): friendly empty state + CTA to create project.
- Large portfolio: pagination or “top N projects by volume” to cap payload.
- Tests: summary respects `projectIds` filter; cross-developer isolation.

### Command palette

- “Open analytics”
- “Analytics: last 30 days” (if palette supports default query params)

---

## Slice 3 — KYC & Verification

**Route**: `/developer/kyc`  
**File**: `apps/web/app/(dashboard)/developer/kyc/page.tsx`.

### Goal

Developer-facing compliance hub: document checklist, status, expiry awareness, uploads linked to developer or project.

### MVP scope

- **Status overview** card: counts by status (pending / verified / rejected / expired).
- **Documents table**: type (enum: C_OF_O, SURVEY, GOVERNOR_CONSENT, CAC, TAX_CLEARANCE, OTHER), linked `projectId` optional, status, `expiresAt` nullable, uploadedAt.
- **Upload**: presign flow per `UPLOAD_VALIDATION_PLAN.md` (PDF + images); private object keys; short-TTL signed read for preview.
- **Drawer**: preview (iframe/pdf) + metadata form (no AI extraction in MVP).

### Post-MVP

- AI extraction + mismatch flags; investor request workflow; “Generate compliance pack” PDF worker.

### API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/kyc/documents` | List + filters (`projectId`, `status`). |
| `POST` | `/kyc/documents/presign` | Upload intent. |
| `POST` | `/kyc/documents` | Finalize: `fileKey`, `documentType`, `projectId?`, `expiresAt?`. |
| `GET` | `/kyc/documents/:id` | Detail + signed preview URL. |
| `PATCH` | `/kyc/documents/:id` | Limited fields if resubmission allowed. |

Admin verification queue is **out of scope** for this slice unless already shared with agent KYC; if shared, document webhook/admin route separately.

### Acceptance criteria

- Developers only see their org’s documents.
- Rejected doc shows reason string from reviewer (nullable until admin flow exists).
- Audit: log create/finalize events (reuse existing audit patterns when present).

### Command palette

- “Upload KYC document”
- “KYC: expiring soon” (filter preset)

---

## Slice 4 — Team Settings

**Route**: `/developer/team`  
**File**: `apps/web/app/(dashboard)/developer/team/page.tsx`.

### Goal

Invite and manage users who can operate on the developer account with **RBAC** and optional project scoping.

### MVP scope

- **Tabs**: Members | Invites | Activity (activity can be read-only log table stub with “empty” if no events).
- **Members table**: name, email, role, lastActiveAt (nullable), status (active/disabled).
- **Invites**: create invite (email + role + optional `projectIds`); list pending invites; revoke.
- **Roles**: fixed enum MVP — `ADMIN`, `SALES`, `MARKETING`, `VIEWER` — with a static permission matrix in UI + enforced in middleware for new routes.

### Post-MVP

- Custom roles, per-project ACL matrix, WhatsApp notify toggles, “AI assistant” capability flags.

### API / data

- Depends on product decision in roadmap §8 (“Team members model vs User invites”). Spec assumes: `DeveloperMembership` (userId, developerId, role, …) + `DeveloperInvite` (token, expiresAt, …).
- All mutations: `ADMIN` only (enforce in Hono + tests).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/team/members` | List members. |
| `PATCH` | `/team/members/:userId` | Role change / disable (ADMIN). |
| `GET` | `/team/invites` | List pending. |
| `POST` | `/team/invites` | Create invite. |
| `DELETE` | `/team/invites/:id` | Revoke. |
| `GET` | `/team/activity` | Paginated audit entries (subset of fields). |

### Acceptance criteria

- Non-admin developer gets 403 on invite/revoke/role change.
- Accept-invite flow documented (likely public route `/invite/accept?token=`); can be slice 4b if needed.
- Tests: RBAC matrix for at least one `SALES` denied case.

### Command palette

- “Invite team member”
- “Team: view members”

---

## Slice 5 — Subscription

**Route**: `/developer/subscription`  
**File**: `apps/web/app/(dashboard)/developer/subscription/page.tsx`.

### Goal

Show current plan, usage vs limits, upgrade path, billing history — **Naira / Paystack** when billing is live.

### MVP scope

- **Current plan** card from server: plan id, renewal date (nullable if free), usage meters (plots listed, leads/month, AI credits) — use **real counters** where available, placeholders with explicit `null` where not.
- **Tier cards** (Starter / Pro / Enterprise): static feature list + CTA “Contact sales” or “Upgrade” that opens Paystack when integrated.
- **Billing history** table: empty state until Paystack webhooks populate `Invoice`/`Payment` tables.

### Post-MVP

- Paystack customer portal, proration, annual/monthly toggle with discount, AI upgrade nudges with computed opportunity (requires analytics slice data).

### API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/subscription` | Current plan + usage + feature flags. |
| `GET` | `/subscription/invoices` | Paginated history. |
| `POST` | `/subscription/checkout` | Returns Paystack authorization URL (stub until keys ready). |

### Acceptance criteria

- Never show fake invoice rows; empty state is correct.
- Upgrade CTA disabled with tooltip when Paystack not configured (env flag).

### Command palette

- “Subscription & billing”

---

## Cross-slice sequencing note

After **Slice 1** merges, narrow `[...slug]` so `/developer/bulk-upload` is explicit. Repeat for analytics, kyc, team, subscription. **`/developer/settings`** remains roadmap Phase D; add a separate tiny spec when product defines settings vs team split.

---

## Revision

| Date | Author | Change |
|------|--------|--------|
| 2026-05-13 | Agent | Initial ordered specs (slices 1–5). |
