# Agent Portal (AgentOS) — Roadmap & Five-Stream Handoff

**Purpose**: One roadmap so **five parallel developers** (or five agent sessions) ship the same product without conflicting ownership, duplicate APIs, or broken integration points.  
**Product spec**: AgentOS UI Specification v1.0 (AGT-01–AGT-12) — Command Center through Settings; tiers **Free · Pro · Elite**; WhatsApp-first and AI where it removes real work.  
**Stack**: Turborepo, Next (`apps/web`), Hono (`apps/api`), Prisma (`packages/db`), Vitest, optional workers / Socket.io / Evolution API as phases land.  
**Reference implementation**: Mirror patterns from [`docs/DEVELOPER_PORTAL_ROADMAP.md`](./DEVELOPER_PORTAL_ROADMAP.md) (contracts, `fake-prisma`, route mounts, portal shell).

**Last updated**: 2026-05-13

---

## 1. How the five developers work together

### 1.1 Stream names and ownership

| Stream | Codename | Owns (write) | Must not own alone |
|--------|----------|--------------|---------------------|
| **1** | **API Core** | `/v1/agent/*` contracts, serializers, RBAC, Prisma, Redis-friendly aggregates, tier limits | Web components, Socket.io, Evolution pods |
| **2** | **Web Portal** | `apps/web/app/(dashboard)/agent/**`, shared dashboard components, `lib/api` client, empty/loading/error states | Database migrations without API review |
| **3** | **Realtime & Messaging** | `GET/POST` message APIs, thread model, Socket.io (or equivalent), presence, typing — **coordinates with API Core** on auth | Listing CRUD (use existing `/v1/listings`) |
| **4** | **Integrations & Intelligence** | Paystack (agent plans), Dojah/KYC stubs, Evolution/WhatsApp bridge workers, AI insight jobs, outbound webhooks | Prisma schema changes without Stream 1 |
| **5** | **QA & DX** | Vitest (`apps/api/tests/agent-*.test.ts`), contract tests, Playwright smoke for `/agent/*`, route inventory updates | Feature logic in production routes |

**Rule**: Every new **JSON field** or route is owned by **Stream 1** first; Streams 2–4 consume via **Zod contracts** + typed client. Stream 5 blocks merge if tests or types drift.

### 1.2 Mandatory integration contract (all streams)

1. **API before UI** for new aggregates: e.g. `GET /v1/agent/dashboard` exists and returns stable shapes before Stream 2 builds KPI cards.
2. **Contracts**: Add or extend `apps/api/src/contracts/agent-*.ts` (or a single `agent-portal.ts` if you prefer one file); export types for web.
3. **Tests**: Stream 1 opens the PR with **Vitest** + `fake-prisma` updates; Stream 5 can add cases but Stream 1 must not leave tests red.
4. **Tier gating**: Server is source of truth (`tier`, `limits`, `usage`). Web only **hides or disables**; never enforce subscription only in the client.
5. **Feature flags**: Long-lead items (WhatsApp, full AI insights) ship behind `AGENT_WHATSAPP_ENABLED`-style env flags until staging is safe.

### 1.3 Weekly cadence (lightweight)

| When | What |
|------|------|
| **Start of week** | Each stream posts **3 outcomes** max (merged or ready for review). |
| **Mid-week** | 30-minute **interface sync**: any breaking request/response change announced; OpenAPI or contract diff linked. |
| **Before merge** | Changelog line in this doc §2 table OR in PR description: **page ID** (e.g. AGT-01) + **stream**. |

---

## 2. Current implementation status (repo snapshot)

Update this table when PRs merge.

| Deliverable | Status | Owner stream | Location / notes |
|-------------|--------|--------------|------------------|
| Agent shell + nav | Done | 2 | `layout.tsx` — `PortalShell` fed from **`GET /v1/agent/context`** (SWR `agent-portal:context`): persona, avatar, tier badge → `/agent/subscription` |
| Command Center (basic) | Partial | 2 | **`GET /v1/agent/dashboard`** KPI strip + `TierGate` (earnings); recent listings + new leads; insights / Cmd+K still out of scope |
| `GET /v1/agent/listings` | Done | 1 | `apps/api/src/routes/v1/agent.ts` |
| `GET /v1/agent/inquiries` | Done | 1 | Same file; `requireAgentOrDeveloper` |
| Listings / new listing / leads UI | Partial | 2 | Under `agent/listings`, `agent/leads` — extend toward AGT-02/04 spec |
| Analytics page | Placeholder | 2 | `agent/analytics/page.tsx` — empty state |
| Subscription page | Placeholder | 2 | `agent/subscription/page.tsx` |
| Settings page | Placeholder | 2 | `agent/settings/page.tsx` |
| Profile / KYC pages | Light | 2 | Mostly `fetchMe`; not full AGT-09/11 |
| `GET /v1/agent/dashboard` | Done (MVP) | 1 | `apps/api/src/routes/v1/agent.ts` + `lib/agent-portal-dashboard.ts` — KPIs, limits, usage, tours preview; Redis later |
| `GET /v1/agent/context` | Done (MVP) | 1 | Same mount — `persona`, `tier` (`free`/`pro`/`elite`), verification flags, `paystackConfigured`, **`featureFlags`** (`AGENT_WHATSAPP_ENABLED`, `AGENT_AI_INSIGHTS_ENABLED`) |
| `GET /v1/agent/tours` | Done (MVP) | 1 | `?upcoming=true` — scoped to listings owned by user; see `lib/agent-portal-dashboard.ts` |
| Vitest `agent-portal` (context, dashboard, tier, tours, **insights**, **messages**) | Done | 1 + 3 + 4 + 5 | `apps/api/tests/agent-portal.test.ts`; `fake-prisma` includes `message` |
| `GET /v1/agent/insights` | Done (MVP) | 1 + 4 | Rule-based feed in `lib/agent-insights.ts`; LLM later |
| Message threads API (`GET/POST /v1/agent/messages*`) | Done (MVP) | 1 + 3 | `lib/agent-messaging.ts` + `agent.ts` — REST inbox; Socket.io later |
| Messages UI (`/agent/messages`) | Done (MVP) | 2 + 3 | `apps/web/app/(dashboard)/agent/messages/page.tsx` + nav in `layout.tsx` |
| WhatsApp bridge route | Not started | 2 + 4 | `/agent/whatsapp` |
| Content studio route | Not started | 2 + 4 | `/agent/content` |
| Listing edit route | Not started | 2 | Spec: `/agent/listings/[id]/edit` |

---

## 3. Phased roadmap (dependency order)

Complete **earlier phases** before starting dependent work, or use **stubs** (typed empty arrays, 501) clearly marked in API responses.

### Phase 0 — Foundations (Streams 1 + 2, ~1 sprint)

**Goals**: Tier model, shell truth, one aggregated dashboard payload.

| Task | Stream | Acceptance |
|------|--------|--------------|
| Prisma / product model for **agent subscription tier** + usage counters (align with spec limits) | 1 | **Uses existing `Subscription` + `SubscriptionPlan`** (`agent_basic` → Pro, `agent_pro` → Elite); limits in `limitsForTier` — add counters table later if needed |
| `GET /v1/agent/context` | 1 | Returns display name, agency, avatar URL if any, `tier`, verification flags, `paystackConfigured` |
| `GET /v1/agent/dashboard` | 1 | KPIs: active listings, new leads, views window, conversion placeholder, Redis optional (in-memory OK for MVP) |
| Wire **PortalShell** or agent layout to `context` | 2 | Done — see `agent/layout.tsx` |
| Wire **AGT-01** KPI strip to `dashboard` | 2 | Done — see `agent/page.tsx` + `TierGate` |
| Vitest for context + dashboard | 1 + 5 | `fake-prisma` extended |

### Phase 1 — Command Center completion (Streams 1, 2, 4)

**Goals**: AGT-01 zones: quick actions row, recent listings table columns toward spec, **insights feed stub** → real when AI ready.

| Task | Stream | Notes |
|------|--------|-------|
| `GET /v1/agent/insights` paginated, dismissible IDs | 1 + 4 | MVP: rule-based insights before LLM |
| Quick actions bar (links only OK) | 2 | |
| Cmd+K palette (navigation + “New listing”) | 2 | Reuse `cmdk` if added for developer A2 |
| `GET /v1/agent/tours?upcoming=true` | 1 | Stub empty list until `Tour` model exists |

### Phase 2 — Listings workspace (Streams 1 + 2)

**Goals**: AGT-02 grid/table, filters, `[id]/edit`; AGT-03 wizard steps incremental.

| Task | Stream | Notes |
|------|--------|--------|
| Filters + sort query params on `GET /v1/agent/listings` | 1 | |
| Bulk actions API (pause / soft-delete) if schema supports | 1 | Confirm with Stream 1 before UI |
| Listing drawer or dedicated edit route | 2 | `/agent/listings/[id]/edit` |
| AI boost badge | 4 + 2 | Tooltip from insight or simple heuristic |

### Phase 3 — Lead inbox CRM (Streams 1 + 2 + 4)

**Goals**: AGT-04 two-panel UI; **lead score** field + periodic update.

| Task | Stream | Notes |
|------|--------|-------|
| `leadScore` (0–100) + `scoreTier` on inquiry or join table | 1 | Migration |
| PATCH inquiry + thread metadata as needed | 1 | |
| Inbox tabs Hot/Warm/Cold | 2 | Driven by API fields |
| AI scoring job (6h) or on-demand | 4 | Calls `apps/ai-service` pattern if exists |

### Phase 4 — Realtime messages (Streams 3 + 1 + 2)

**Goals**: AGT-06 MVP — threads + REST first, then Socket.io.

| Task | Stream | Notes |
|------|--------|--------|
| Thread + message schema | 1 + 3 | |
| REST list/send | 1 | |
| Socket namespace `/agent` auth | 3 | JWT same as API |
| `/agent/messages` UI | 2 | |

### Phase 5 — WhatsApp bridge (Streams 4 + 1 + 2)

**Goals**: AGT-05 connection wizard + review queue; feature-flagged.

| Task | Stream | Notes |
|------|--------|--------|
| Evolution integration worker | 4 | Secrets in env |
| `POST /v1/agent/whatsapp/session` etc. | 1 | Contract-first |
| `/agent/whatsapp` | 2 | Two states per spec |

### Phase 6 — Analytics & content (Streams 1 + 2 + 4)

**Goals**: AGT-07 sections (start Overview); AGT-08 generator stub → SEO pipeline.

| Task | Stream | Notes |
|------|--------|--------|
| Daily rollup table or materialized metrics | 1 + 4 | |
| Recharts on `/agent/analytics` | 2 | Free = basic; blur + upsell for Pro charts |
| Content variants API | 4 | Rate limits per tier |

### Phase 7 — KYC, billing, profile, settings (Streams 1 + 2 + 4)

**Goals**: AGT-09 Dojah; AGT-10 Paystack parity with developer subscription; AGT-11 editor + strength meter; AGT-12 grouped settings.

| Task | Stream | Notes |
|------|--------|--------|
| `POST /v1/agent/kyc/verify-bvn` | 1 + 4 | Hash BVN; never log raw |
| Agent subscription checkout + invoices | 1 + 4 | Mirror `me.developer.subscription` |
| Profile PATCH + public preview | 1 + 2 | |
| Settings PATCH sections | 1 + 2 | Start with notifications JSON column |

### Phase 8 — Elite / API (Streams 1 + 5)

**Goals**: AGT-12 API keys + webhooks; usage meters.

---

## 4. Per-stream instructions (what “done” means)

### Stream 1 — API Core

- Mount new routes under `apps/api/src/routes/v1/agent*.ts` (or split files by domain); keep **`requireAgentOrDeveloper`** or stricter **`requireRole(agent)`** where spec demands agent-only.
- Every endpoint: **Zod** query/body/response shape; **403** with stable `code` when tier insufficient.
- Update **`apps/api/tests/helpers/fake-prisma.ts`** in the same PR as new models.
- Document new env vars in **`.env.example`** only (not secrets).

### Stream 2 — Web Portal

- Reuse `PortalShell`, `portal-feedback`, shadcn patterns; no one-off CSS systems.
- All fetches through **`apps/web/lib/api/`** (add `agent-portal.ts` if the file grows).
- **TierGate** component: `minTier="pro"` wraps Pro/Elite blocks; Free users see upgrade CTA consistent with copy in spec.
- Accessibility: focus rings, keyboard nav for inbox and Cmd+K.

### Stream 3 — Realtime & Messaging

- Never bypass API auth: Socket handshake validates JWT or short-lived ticket issued by **Stream 1**.
- Backpressure and rate limits on send; max attachment size enforced server-side.
- Document local dev: how to run socket server alongside Next.

### Stream 4 — Integrations & Intelligence

- All third-party calls **async** with timeouts; store **audit** rows for AI and WhatsApp extractions.
- Idempotency keys for Paystack and import webhooks.
- When Dojah/Evolution unavailable, return **degraded** responses documented in contract (do not 500 silently).

### Stream 5 — QA & DX

- Minimum: **one Vitest file per new route group**; assert auth, tier, and happy path JSON shape.
- Add Playwright: login as seed agent → `/agent` loads dashboard cards without console error.
- Keep **`docs/AGENT_PORTAL_ROADMAP.md` §2** status table accurate via PR checklist item.
- **Agent portal (landed)**: `apps/web/e2e/agent-portal.spec.ts` mocks `/v1/agent/*` so smoke does not require a live API; `apps/api/tests/agent-portal.test.ts` includes **Zod** contract checks on context + dashboard payloads.

---

## 5. Page → stream RACI (responsible / accountable)

**A** = accountable (approves), **R** = implements, **C** = consulted, **I** = informed.

| Page ID | API Core | Web | Realtime | Integrations | QA |
|---------|----------|-----|----------|--------------|-----|
| AGT-01 | R/A | R | C | C | R |
| AGT-02 | R | R/A | I | C | R |
| AGT-03 | R | R/A | I | C | R |
| AGT-04 | R | R/A | C | R | R |
| AGT-05 | R | R | I | R/A | R |
| AGT-06 | R | R | R/A | C | R |
| AGT-07 | R | R/A | I | R | R |
| AGT-08 | R | R/A | I | R/A | R |
| AGT-09 | R | R/A | I | R | R |
| AGT-10 | R | R/A | I | R/A | R |
| AGT-11 | R | R/A | I | C | R |
| AGT-12 | R | R/A | C | R | R |

---

## 6. Out of scope for v1.1 (track separately)

- Full **auto-post** to all social channels without human approval.
- **Multi-number** WhatsApp Elite before Pro single-number is stable.
- **Deal probability** model without labelled outcome data — ship heuristics first.

---

## 7. Quick links (implementation)

- Existing agent routes: `apps/api/src/routes/v1/agent.ts`
- Agent portal contracts / tier helpers: `apps/api/src/contracts/agent-portal.ts`, `apps/api/src/lib/agent-portal-tier.ts`, `apps/api/src/lib/agent-portal-dashboard.ts`
- Vitest: `apps/api/tests/agent-portal.test.ts`
- Web client: `apps/web/lib/api/agent-portal.ts`, `apps/web/components/dashboard/tier-gate.tsx`, `apps/web/app/(dashboard)/agent/layout.tsx`, `apps/web/app/(dashboard)/agent/page.tsx`
- Playwright (agent): `apps/web/e2e/agent-portal.spec.ts`
- Developer roadmap (patterns to copy): `docs/DEVELOPER_PORTAL_ROADMAP.md`

---

*Confidentiality: Internal engineering roadmap. Product copy and tier numbers belong to the AgentOS spec owned by Stacklane / LandShoppers product.*
