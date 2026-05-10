# LandShoppers Gap Closure Plan - 5 Agent Supervision Model

Date verified: 2026-05-09

Source framework: `LandShoppers_Project_Framework_v1.1.md`

## 1. Executive Finding

The reported gap is true.

The repository currently contains an early single Next.js application with Prisma schema coverage and mock-driven public/dashboard pages. It does not yet contain the production architecture described in the framework: Turborepo monorepo, dedicated API app, FastAPI AI service, queues/workers, OpenSearch, WhatsApp bridge integration, Paystack webhooks, admin/agent/buyer portals, CI/CD, Docker Compose, or launch-grade QA/security gates.

The schema is the most advanced part of the implementation. Product behavior, backend services, integrations, jobs, and operational tooling remain largely unimplemented.

## 2. Verification Evidence

### Confirmed In Repository

- `package.json` is a single app package named `my-project`, with scripts only for `dev`, `build`, `start`, and `lint`.
- App routes exist for:
  - home
  - listings list/detail
  - agents list/detail
  - services list/detail
  - auth pages: login, register, reset password, verify OTP
  - partial developer dashboard: dashboard, projects, leads
- `prisma/schema.prisma` defines 26 Prisma models, including most framework domains:
  - users, profiles, agents, developers
  - properties, listings, images, features, price history
  - saved searches, inquiries, tours, messages, reviews
  - subscriptions, payments
  - service providers
  - raw WhatsApp messages, WhatsApp groups
  - SEO variants, posting schedule
  - AI request log, audit log
- PostGIS extension is declared in Prisma, but `Property` and `DeveloperProject` only expose `latitude` and `longitude`; the framework's `geom` column is noted as raw SQL but no migration exists in the repo.
- Public pages and developer dashboard pages use local arrays, mock objects, or TODO handlers. Examples:
  - login simulates an API call and has a TODO for JWT RS256 auth
  - register has a TODO for real registration and OTP verification
  - listings, agents, services, and developer dashboard pages use mock data arrays

### Confirmed Missing

- No `app/api` directory or backend route handlers.
- No separate `apps/api`, `apps/ai-service`, `packages/db`, or `packages/ui`.
- No `turbo.json`.
- No `docker-compose.yml` or Dockerfiles.
- No `prisma/migrations` folder.
- No BullMQ workers.
- No FastAPI service.
- No OpenSearch/Elasticsearch client or index sync code.
- No Socket.io messaging server.
- No Paystack, Flutterwave, Termii, Dojah, SES, S3, Sharp, Evolution API, or Mapbox implementation code.
- No GitHub Actions workflows.
- No Playwright, k6, OWASP ZAP, Sentry, Datadog, or Snyk config.

## 3. Framework Count Issue

The framework says "38 pages across 6 portal sections", but its detailed inventory lists:

- Public Portal: 21 pages
- Buyer/User Dashboard: 8 pages
- Agent Portal: 12 pages
- Developer Portal: 10 pages
- WhatsApp Automation Panel: 6 pages
- SEO Engine: 8 pages
- Admin Panel: 12 pages

That totals 77 listed page rows, not 38. Treat this as a framework inconsistency that must be resolved before final sprint acceptance is locked. Until then, track completion by route/feature ID rather than by the stated page count.

## 4. Gap Summary By Layer

### Layer 1 - Core Marketplace

Status: partially scaffolded UI and mostly aligned schema, but no functional backend.

Missing or incomplete:

- Auth: real registration, OTP, Google OAuth, JWT RS256, refresh/revocation, RBAC, rate limiting.
- Listings: CRUD API, lifecycle rules, image upload, S3/Sharp/WebP pipeline, expiry, boosts.
- Search: OpenSearch, autocomplete, faceted filters API, PostGIS radius/bbox API, Mapbox search page.
- Agents: agent portal, KYC/Dojah, lead inbox, subscriptions, analytics, payouts.
- Payments: Paystack checkout, subscriptions, boosts, webhook validation, idempotency.
- Messaging: Socket.io, email/SMS notifications, tour scheduling.
- Directory: provider onboarding, provider detail persistence, reviews, admin moderation.

### Layer 2 - WhatsApp, Developers, AI Extraction

Status: schema exists for developers, WhatsApp messages, and AI logs; implementation is missing or mock-only.

Missing or incomplete:

- WhatsApp webhook receiver with HMAC/signature validation.
- Raw message persistence wired to webhook.
- BullMQ extraction queue and workers.
- FastAPI `/extract-listing` service.
- Confidence score and human approval workflow.
- Developer CRUD APIs, unit inventory, KYC, team management, lead management.

### Layer 3 - OutcomeLabs SEO Engine

Status: schema exists, but there is no pipeline.

Missing or incomplete:

- `seo-generation-queue`.
- `/generate-seo-variants` AI endpoint.
- Prompt/model fallback chain.
- Variant approval UI.
- Auto-trigger on listing approval.
- Multi-channel posting integrations.
- Analytics and content calendar.

### Operations And Quality

Status: not started.

Missing or incomplete:

- Monorepo structure.
- Local development services.
- Migrations and seed pipeline.
- CI/CD.
- Unit/integration/E2E/load/security tests.
- Launch gate evidence.
- Observability and dependency scanning.

## 5. Five-Agent Work Division

The five agents should work in parallel but not independently. The supervisor owns the integration contract, merge order, shared definitions of done, and dependency sequencing.

### Agent 1 - Platform, Database, Infrastructure

Primary ownership:

- Monorepo structure and package boundaries.
- Docker Compose local services.
- Prisma migrations, seed data, PostGIS verification.
- Shared env contract.
- CI baseline.

Framework coverage:

- LAND-001, LAND-003, LAND-004, LAND-005, LAND-006
- Supports F-010, F-020, F-022, F-070, F-120 through infrastructure

Deliverables:

- Restructure repo to `apps/web`, `apps/api`, `apps/ai-service`, `packages/db`, and shared packages as needed.
- Add Docker Compose for Postgres/PostGIS, Redis, OpenSearch, and optional Evolution API.
- Convert current schema into reproducible migrations.
- Add raw SQL migration for `geom` geography/geometry columns and GIST indexes on properties and developer projects.
- Add seed script with representative users, agents, developers, listings, providers, and WhatsApp messages.
- Add CI workflow for lint, typecheck, tests, and build.

Acceptance gates:

- Fresh clone can run local services and apply migrations.
- `prisma migrate deploy` or equivalent succeeds from empty DB.
- PostGIS extension and GIST indexes are verifiable.
- CI passes on a clean branch.

### Agent 2 - API, Auth, Listings, Search, Payments

Primary ownership:

- Node API application.
- Auth and RBAC.
- Listing CRUD and search APIs.
- Payments and external backend integrations.

Framework coverage:

- F-001 to F-008
- F-010 to F-017
- F-020 to F-026
- F-040 to F-046
- F-050 to F-055 backend support
- LAND-010 to LAND-013, LAND-020 to LAND-022, LAND-030 to LAND-033, LAND-040 to LAND-043

Deliverables:

- `apps/api` with health endpoint, typed route structure, request validation, error format, auth middleware, and Prisma access.
- Register, login, refresh, logout/revoke, OTP verify/resend, password reset, Google OAuth callback.
- RBAC middleware for buyer, agent, developer, admin, and super_admin.
- Listing/property CRUD APIs with lifecycle validation.
- Upload pipeline contract for S3-compatible storage, Sharp resize, and WebP variants.
- OpenSearch index sync queue and search endpoint.
- PostGIS radius/bbox search endpoint.
- Paystack subscription and payment flow with HMAC verified webhook and idempotency.
- Socket.io service foundation if kept in Node API.

Acceptance gates:

- Auth integration tests cover happy path, invalid OTP, token replay, lockout, and RBAC denial.
- Listing CRUD tests cover ownership and invalid lifecycle transitions.
- Search API returns consistent text, filter, sort, and geo results against seed data.
- Paystack webhook tests verify signature, replay prevention, and duplicate event handling.

### Agent 3 - AI, WhatsApp Automation, SEO Workers

Primary ownership:

- FastAPI AI service.
- WhatsApp ingestion and extraction workers.
- SEO generation workers.
- AI audit/cost tracking.

Framework coverage:

- F-070 to F-080
- F-100 to F-113
- F-120 to F-126
- LAND-026, LAND-027, LAND-033, LAND-034, LAND-046, LAND-050, LAND-051, LAND-066, LAND-068

Deliverables:

- `apps/ai-service` FastAPI app with `/health`, `/extract-listing`, and `/generate-seo-variants`.
- Shared JSON schemas for extraction and SEO variants.
- Model adapter layer for Claude primary with Grok/OpenAI fallbacks where required.
- Cost/rate-limit tracking and AI request audit logging.
- WhatsApp webhook processing contract with Agent 2.
- BullMQ workers:
  - `whatsapp-extraction-queue`
  - `seo-generation-queue`
  - dead letter handling
- Confidence scoring, duplicate detection, and listing creation job on human approval.
- SEO variant generation with the 10 framework variant types and approval-ready persisted records.

Acceptance gates:

- AI service runs independently and passes contract tests.
- Extraction returns deterministic schema-valid JSON for fixture messages.
- Low confidence messages are routed to review instead of auto-published.
- SEO generation creates all required variant records for an approved listing.
- Worker retries and dead letter behavior are observable in tests.

### Agent 4 - Web Application And Portal UX

Primary ownership:

- Next.js frontend.
- Public pages.
- Buyer, agent, developer, WhatsApp, SEO, and admin portal UI.
- API integration and route guards.

Framework coverage:

- Page inventory across public, buyer, agent, developer, WhatsApp, SEO, and admin portals.
- LAND-014, LAND-015, LAND-023 to LAND-025, LAND-035, LAND-036, LAND-042, LAND-044, LAND-045, LAND-053 to LAND-055, LAND-060 to LAND-065, LAND-074

Deliverables:

- Move current app into `apps/web` while preserving working routes.
- Replace mock data with API-backed loaders/actions.
- Auth UI connected to real API.
- Route guards and role-aware navigation.
- Listing search, filters, detail, inquiry, and map UI connected to backend.
- Agent portal: dashboard, listings, KYC, leads, subscription, analytics first slice.
- Developer portal: project CRUD, unit inventory, leads, team, analytics.
- WhatsApp panel: pending queue, message detail, approve/edit/reject, group/settings screens.
- SEO engine: dashboard, generator, approval queue, calendar, channel manager, analytics.
- Admin core: users, listings moderation, agents/developers, payments, reports, audit logs.

Acceptance gates:

- No launch-critical page uses local mock arrays for production data.
- Role guards prevent cross-portal access.
- Critical user journeys pass Playwright tests:
  - buyer searches and sends inquiry
  - agent registers, verifies, creates listing
  - developer creates project and unit
  - admin approves WhatsApp listing
  - SEO variant approval flow

### Agent 5 - QA, Security, Observability, Release Management

Primary ownership:

- Test strategy.
- Security and compliance gates.
- Observability.
- Release readiness and sprint evidence.

Framework coverage:

- LAND-017, LAND-028, LAND-037, LAND-047, LAND-057, LAND-067, LAND-070 to LAND-078
- Production launch gates G1 to G15

Deliverables:

- Unit/integration/E2E test conventions across apps.
- Playwright critical journey suite.
- k6 load tests for listing search and high-value APIs.
- OWASP ZAP baseline scan workflow.
- Security checklist for auth, cookies, CSP, HSTS, webhook replay, file uploads, XSS, SSRF, and privilege escalation.
- Sentry/Datadog or equivalent observability setup.
- Snyk/dependency scanning.
- Release checklist and UAT signoff tracker.

Acceptance gates:

- CI blocks merges on lint, typecheck, unit/integration tests, and build.
- E2E critical journeys pass before release candidate.
- Load test meets framework p99 target or has documented exceptions.
- Security findings are triaged with severity, owner, and release decision.
- Launch gate evidence is attached to each gate.

## 6. Supervisor Operating Model

The supervisor should manage the five agents through dependency contracts, not just task status.

### Daily Control Points

- Morning dependency review:
  - blocked contracts
  - schema/API changes
  - migration risk
  - test failures
- Midday integration check:
  - PR status
  - shared package changes
  - environment drift
  - breaking API changes
- End-of-day evidence review:
  - merged work
  - test output
  - unresolved risks
  - next-day blockers

### Merge Order

1. Agent 1 foundation changes.
2. Agent 2 API contracts and auth/listing/search skeleton.
3. Agent 3 AI and worker skeletons using shared contracts.
4. Agent 4 web integration against stable API contracts.
5. Agent 5 quality gates, then cross-agent hardening PRs.

After skeletons are merged, feature slices should merge vertically:

1. Auth vertical slice.
2. Listing creation and public listing vertical slice.
3. Search and map vertical slice.
4. WhatsApp message to approval to listing vertical slice.
5. SEO generation to approval vertical slice.
6. Payments/subscriptions vertical slice.
7. Admin and launch gates.

### Shared Definition Of Done

No story is done unless:

- It has typed request/response contracts.
- It has validation and authorization.
- It handles expected failure modes.
- It has seed or fixture data where useful.
- It has automated tests at the right level.
- It updates env/config documentation.
- It removes or isolates mock-only behavior from production routes.
- It has observability for critical backend paths.

## 7. First Two Weeks Execution Plan

### Week 1

Agent 1:

- Create monorepo structure.
- Move current Next app into `apps/web`.
- Add `packages/db` with Prisma schema.
- Add Docker Compose for Postgres/PostGIS, Redis, OpenSearch.
- Start migrations from current schema.

Agent 2:

- Scaffold `apps/api`.
- Add health endpoint, error format, validation helpers, auth module skeleton.
- Define auth/listing/search API contracts.

Agent 3:

- Scaffold FastAPI app.
- Add `/health`, `/extract-listing` stub, `/generate-seo-variants` stub.
- Define extraction and SEO JSON schemas.

Agent 4:

- Stabilize existing web routes after monorepo move.
- Inventory every framework page as `done`, `partial`, or `missing`.
- Prepare route guard structure and API client layer.

Agent 5:

- Add test framework decisions and CI requirements.
- Add initial smoke tests for web and API health.
- Create launch gate evidence template.

Supervisor:

- Approve monorepo boundaries and naming.
- Freeze initial env variable names.
- Resolve the framework page count mismatch with PM/architect.
- Publish API contract review schedule.

### Week 2

Agent 1:

- Finish migrations and seed.
- Verify PostGIS extension, `geom` columns, and indexes.
- Ensure local bootstrap is reproducible.

Agent 2:

- Implement register/login/refresh/logout and RBAC middleware.
- Add first authenticated route.
- Start listing CRUD skeleton.

Agent 3:

- Add BullMQ worker skeletons.
- Add fixture-based extraction tests.
- Add AI request logging contract.

Agent 4:

- Connect auth pages to API.
- Add protected dashboard routing.
- Replace one developer dashboard stat block with API data once available.

Agent 5:

- Add auth integration tests.
- Add basic Playwright smoke test.
- Add dependency/security baseline.

Supervisor:

- Run first end-to-end vertical slice review: login to protected route.
- Confirm no production route depends on mock data without an explicit feature flag.
- Decide release branch and PR naming conventions.

## 8. Risk Register

| Risk | Severity | Owner | Mitigation |
| --- | --- | --- | --- |
| Framework page count conflict may distort scope | High | Supervisor | Resolve with PM before sprint acceptance is finalized |
| Current schema has 26 models while framework says 24 tables | Medium | Agent 1 | Decide whether extra tables are intentional or need framework update |
| PostGIS `geom` is documented but not migrated | High | Agent 1 | Add raw SQL migration and verification test |
| Too many dashboards may be built before APIs | High | Supervisor | Enforce API contract and vertical slices before UI expansion |
| External credentials may block integration | High | Supervisor | Use adapters, mocks, and sandbox modes until credentials arrive |
| WhatsApp automation can create bad listings if confidence logic is weak | High | Agent 3 | Human approval gate remains mandatory for launch |
| Payment and webhook bugs create financial risk | High | Agent 2 / Agent 5 | HMAC, idempotency, replay tests, sandbox smoke tests |
| AI cost can spike without guardrails | Medium | Agent 3 | Per-endpoint rate limits, budget alerts, audit logging |

## 9. Recommended Immediate Decision

Proceed with the gap closure as a rebuild around the existing schema and UI assets, not as incremental page patching. The fastest safe path is:

1. Preserve current UI as the web app baseline.
2. Move to the framework monorepo.
3. Make DB migrations reproducible.
4. Build API/auth/listings/search first.
5. Wire one complete vertical slice.
6. Expand portals only after backend contracts are stable.

## 10. Agent 1 Handoff Review - 2026-05-09

Status: accepted with local environment caveats.

Agent 1's foundation work is now present in the repository and satisfies the platform/database/infrastructure lane for the next agents to build against.

### Verified Present

- Monorepo files:
  - `pnpm-workspace.yaml`
  - `turbo.json`
  - `apps/web`
  - `apps/api`
  - `apps/ai-service`
  - `packages/db`
- Local service definition:
  - `docker-compose.yml` for Postgres/PostGIS, Redis, and OpenSearch.
- Database package:
  - `packages/db/prisma/schema.prisma`
  - `packages/db/prisma/migrations/20260509120000_init/migration.sql`
  - `packages/db/prisma/migrations/20260509120001_postgis_geom/migration.sql`
  - `packages/db/prisma/seed.ts`
  - `packages/db/scripts/verify-postgis.ts`
- CI:
  - `.github/workflows/ci.yml`
  - install, lint, migration deploy, PostGIS verification, and build steps.
- Bootstrap documentation:
  - `README.md`
  - `.env.example`

### Verified Technical Details

- `Property` and `DeveloperProject` now include `geom Unsupported("geography(Point,4326)")?`.
- The PostGIS migration adds `geom` geography columns, creates `properties_geom_gix` and `developer_projects_geom_gix`, and backfills from latitude/longitude.
- The seed script updates `geom` after creating seeded property/project rows with latitude/longitude.
- `verify-postgis.ts` checks:
  - `postgis` extension exists
  - `properties.geom` exists
  - `developer_projects.geom` exists
  - both GIST indexes exist
- `@landshoppers/db` and `@landshoppers/api` lint scripts run `tsc --noEmit`, so they are no longer no-op package checks.

### Acceptance Gate Status

| Gate | Status | Notes |
| --- | --- | --- |
| Monorepo + package boundaries | Accepted | `apps/*` and `packages/db` are present |
| Docker Compose | Accepted | File present; local Docker not available in reported environment |
| Reproducible migrations | Accepted | Init and PostGIS geom migrations present |
| PostGIS geom and GIST verification | Accepted | Verify script and CI step present |
| Representative seed | Accepted | Users, agent, developer, listing, project/unit, WhatsApp, inquiry data present |
| CI lint/migrate/build | Accepted | Workflow present and correctly ordered |
| Bootstrap docs | Accepted | README and env example present |

### Local Verification Caveats

- Docker was not available in the agent's local environment, so migrations and `verify:postgis` were not executed against a live local Postgres instance there.
- In this supervisor shell, direct `pnpm` was not on PATH. `corepack pnpm` was available, but invoking Turbo through `pnpm turbo`, `pnpm exec turbo`, or the local Turbo shim failed with package-manager binary resolution errors. This appears to be local shell/tooling resolution, not a repository structure issue.
- CI should still be the source of truth for the Agent 1 acceptance gates because the workflow installs pnpm explicitly with `pnpm/action-setup`.

### Supervisor Decision

Agent 1 is unblocked and accepted for downstream work. Agent 2 and Agent 3 may now build against:

- `packages/db`
- the migration contract
- the PostGIS verification script
- the `apps/api` and `apps/ai-service` app boundaries
- the root env contract

Do not spend more time on optional Dockerfiles or Turbo output polish until Agent 2 and Agent 3 have their first API/AI contracts merged, unless CI reports failures directly tied to those omissions.

## 11. Five-Agent Phase Review - 2026-05-09

Status: accepted as a first implementation slice, not accepted as full framework completion.

All five agent lanes now have concrete repo output:

- Agent 1: monorepo, DB package, Docker Compose, migrations, seed, PostGIS verification, CI bootstrap.
- Agent 2: API app, Hono routing, health routes, auth/listing/search contracts, Prisma-backed listing/search MVP, auth stubs.
- Agent 3: FastAPI AI service, extraction endpoint, SEO variants endpoint, schema exports, rate-limit/audit scaffolding, BullMQ worker app.
- Agent 4: web API client layer, auth page API reachability, listing API mapping, developer stat API component, middleware/route guard shell.
- Agent 5: CI broadened to Python tests, typecheck lint across packages, AI pytest suite, build gate coverage.

### Verification Results

Commands run locally on 2026-05-09:

| Gate | Result | Notes |
| --- | --- | --- |
| `npm run lint` | PASS | 5/5 packages successful |
| `npm run build` | PASS | 5/5 packages successful |
| `npm --prefix apps/ai-service run test` | PASS | 5 pytest tests passed |
| Web dev server | PASS | `http://localhost:3000` returned HTTP 200 |

Build initially failed because `next/font/google` required network access for Google Fonts. This was fixed by removing runtime Google font imports and using a local system font stack in `apps/web/app/layout.tsx` and `apps/web/app/globals.css`.

### Accepted Scope

This phase is accepted for:

- Repository architecture foundation.
- Compile/build health.
- Initial backend contracts and route structure.
- AI service fixture-mode contracts and tests.
- Worker process skeletons.
- Web-to-API integration scaffolding.

### Not Yet Complete

The following are still open and must not be represented as completed framework work:

- Auth is stubbed: JWT RS256, OTP, Google OAuth, refresh/revocation, RBAC enforcement, and rate limiting are not implemented.
- Listings API is still an MVP slice; create/update/delete lifecycle, image upload, S3/Sharp/WebP, expiry, and boosts are incomplete.
- Search is Prisma-backed MVP; OpenSearch indexing/ranking/autocomplete is not implemented.
- Workers call the AI service, but there is no complete persisted WhatsApp ingestion-to-approval-to-listing workflow yet.
- AI service runs in fixture mode; live LLM model adapters and cost controls are not production-complete.
- Payments, KYC, Socket.io messaging, SES/SMS, Paystack webhooks, social posting, admin portal, buyer dashboard, agent portal, and most route inventory remain incomplete.
- Existing public agent/service/developer pages still contain mock data in several places.
- Docker/OpenSearch local startup needs a clean verification pass; Postgres/Redis were started, but full Compose with OpenSearch previously hung in this environment.

### Supervisor Decision

The five-agent foundation phase is complete enough to move forward.

Next phase should be a vertical product slice, not more scaffolding:

1. Auth implementation: register/login/refresh/logout, password reset, OTP stub provider, RBAC.
2. Listing management: authenticated create/read/update/status transition using real DB records.
3. Web integration: connect auth pages and listing flows to the API.
4. Worker integration: create a persisted WhatsApp message -> extraction -> review queue path.
5. Tests: add API integration tests and one Playwright journey for login + listing browsing.

## 12. Week 2 Supervisor Takeover - 2026-05-10

Status: proceed with Week 2 vertical slice work.

The five-agent foundation phase is accepted as a working scaffold. The next phase should not restart Week 1. Continue from Week 2, but treat it as a supervised integration phase where every lane must produce runnable, tested slices that connect to the shared API/DB contracts.

### Verified Today

| Gate | Result | Notes |
| --- | --- | --- |
| `npm --prefix apps/ai-service run test` | PASS | 11 pytest tests passed with no warnings |
| `npm run lint` | PASS | 5/5 packages successful |
| `npm run build` | PASS | 5/5 packages successful |
| Docker services | PASS | PostGIS, Redis, and OpenSearch containers are running |
| Container PostGIS shape | PASS | PostGIS extension, `geom` columns, and both GIST indexes verified by `docker exec` |
| `npm run db:migrate` | PASS | Local dev DB baselined; no pending migrations |
| `npm run db:seed` | PASS | Seed inserted representative local data |
| `npm run db:verify:postgis` | PASS | Verified through normal npm script after port fix |
| Prisma seed command | FIXED | `packages/db/prisma.config.ts` now registers `tsx prisma/seed.ts` |
| AI Python launcher | FIXED | Prefers the installed local Python interpreter before Windows Store aliases |
| Current Docker Desktop service | BLOCKED | `com.docker.service` is stopped and Windows refused restart from this session |

### Week 2 Work Already Started By Supervisor

- Auth:
  - Implemented development-mode OTP verify/resend endpoints.
  - Login/register/refresh/logout were already present and Prisma-backed.
- Listings:
  - Added typed update and status-transition request contracts.
  - Added authenticated `PATCH /api/v1/listings/:id`.
  - Added authenticated `POST /api/v1/listings/:id/status`.
  - Added owner/admin management authorization for listing mutation.
- AI service:
  - Installed missing dev test dependency into the active Python interpreter.
  - Confirmed the AI service test suite passes.
  - Moved pytest cache back inside `apps/ai-service` so tests run without cache warnings.

### Environment Caveat

The repo `.env` currently points to a temporary `prisma+postgres://...` URL, while the shared local development contract in `.env.example` expects:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/landshoppers?schema=public"
```

Docker is running, but this machine has a local Windows PostgreSQL service on `localhost:5432` that does not include PostGIS. The local Compose ports were moved away from common defaults so the project has explicit development endpoints:

- PostGIS: `localhost:55432`
- Redis: `localhost:56379`

After the port fix, a later Docker Desktop service restart attempt left `com.docker.service` stopped, and Windows refused to start it from this session. The repository-side fixes are complete; Docker Desktop must be started manually before repeating the runtime smoke commands.

Required runtime smoke after Docker is available:

```bash
npm run docker:up
npm run db:migrate
npm run db:seed
npm run db:verify:postgis
npm run dev
```

### Agent Continuation Plan

Agent 1 - Platform/DB:

- Do not rebuild the monorepo.
- Fix `.env` drift for local Compose PostGIS.
- Run the DB smoke sequence against Docker PostGIS.
- Optional only after the vertical slice is stable: add Turbo build outputs for `@landshoppers/db` and minimal Dockerfiles.

Agent 2 - API/Auth/Listings:

- Continue Week 2 from the current auth/listing implementation.
- Add password reset and rate-limit scaffolding.
- Add API integration tests for register, login, refresh, OTP verify/resend, listing create/update/status.
- Keep OpenSearch/payment work queued until auth/listing mutation tests are green.

Agent 3 - AI/Workers/WhatsApp:

- Continue from the passing AI fixture tests.
- Wire worker output into a persisted review queue path.
- Add tests for WhatsApp message -> extraction -> review-needed state.
- Keep live LLM adapters behind fixture mode until audit/rate limits are proven.

Agent 4 - Web/Portal UX:

- Continue Week 2 web integration.
- Verify auth pages against the real API.
- Add the first protected dashboard route using API-backed identity/role checks.
- Replace one developer dashboard stat block with real API data after Agent 2 exposes it.

Agent 5 - QA/Security/Release:

- Add API integration test command to the standard test gate.
- Add one Playwright smoke journey: login -> protected route -> listing browse.
- Keep the AI pytest suite warning-free in CI.
- Begin the release evidence template with lint/build/AI-test proof from this section.

### Supervisor Gate For End Of Week 2

Week 2 is accepted only when this vertical slice works end to end:

1. Local Docker PostGIS is running with migrations, seed, and PostGIS verification passing.
2. A seeded or newly registered user can log in through the API.
3. That user can create or update a listing through authenticated API routes.
4. The web app can use the same API contract for login and at least one protected/dashboard view.
5. Automated checks include lint, build, AI tests, API auth/listing tests, and one browser smoke path.
