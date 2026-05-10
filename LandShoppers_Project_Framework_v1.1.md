**STACKLANE TECHNOLOGIES LTD**

hello@stacklane.io · +234 901 234 5678 · Lagos, Nigeria

**PROJECT DEVELOPMENT FRAMEWORK · v1.1 UNIFIED**

**LandShoppers**

_Global Real Estate Marketplace_

Full Production Build · Phase 1 Complete Scope

|     |     |
| --- | --- |
| Version | 1.1 — Unified (v1.0 Core + v1.1 Extensions + OutcomeLabs SEO) |
| Date | May 2026 |
| Firm | Stacklane Technologies Ltd |
| Architect | Chidi Okonkwo — Software Architect & Technical Lead |
| PM  | Temi Lawson — Project Manager & Scrum Master |
| Total Pages | 38 pages across 6 portal sections |
| Total Features | 127 discrete features across 12 modules |
| New Scope Added | Developers Portal + WhatsApp Automation + OutcomeLabs SEO Engine |
| Delivery Timeline | 16 weeks (8 sprints of 2 weeks each) |
| Classification | CLIENT CONFIDENTIAL |

**FRAMEWORK PURPOSE** This document is the single source of truth for the LandShoppers build. Every engineer, designer, and the foreign software engineer must read this before writing their first line of code. Page numbers, feature counts, module assignments, API contracts, and sprint commitments herein are final unless a Change Request is raised.

# **1\. Unified Scope — What We Are Building**

## **1.1 Platform Summary**

LandShoppers is a production-grade, multi-sided global real estate marketplace targeting Nigeria and the African diaspora. The Phase 1 build encompasses the core marketplace (property listings, agents, service directory), a dedicated Developers Portal for real estate developers, a WhatsApp-to-listing automation pipeline, and the OutcomeLabs-powered SEO Engine that generates AI content variants for every listing across multiple channels.

## **1.2 The Three Scope Layers**

| **Layer** | **Origin** | **Scope** |
| --- | --- | --- |
| Layer 1 | Architecture v1.0 | Core marketplace: listings, search, agents, payments, admin, service directory |
| Layer 2 | Architecture v1.1 | WhatsApp automation, Developers Portal, AI extraction service |
| Layer 3 | OutcomeLabs SEO | Automated SEO variant generation, social copy, hashtags, multi-channel posting |

## **1.3 Module Inventory (12 Modules)**

| **#** | **Module** | **Layer** | **Responsibility** |
| --- | --- | --- | --- |
| 1   | auth | L1  | Registration, login, JWT, OTP, OAuth, RBAC, session management |
| 2   | users | L1  | Buyer/seller profiles, saved properties, preferences, KYC status |
| 3   | listings | L1  | Property CRUD, image upload, status management, listing expiry |
| 4   | search | L1  | Elasticsearch, geospatial (PostGIS), autocomplete, saved searches |
| 5   | agents | L1  | Agent profiles, KYC flow, lead inbox, subscriptions, analytics |
| 6   | payments | L1  | Paystack, Flutterwave, webhook handling, escrow, subscriptions |
| 7   | messaging | L1  | Socket.io real-time chat, thread management, notifications |
| 8   | directory | L1  | Service provider listings, categories, reviews, lead capture |
| 9   | whatsapp | L2  | Bridge webhook, message ingestion, BullMQ queue, approval UI |
| 10  | developers | L2  | Developer portal, projects, off-plan listings, bulk upload |
| 11  | seo | L3  | OutcomeLabs SEO engine, variant generation, multi-channel posting |
| 12  | ai  | L2/L3 | Central AI service (FastAPI/Python): extraction, SEO, valuation |

# **2\. Complete Page Inventory — 38 Pages Across 6 Portals**

_Every page listed below corresponds to at least one sprint story ticket. The Page ID is used in acceptance criteria, design Figma frames, and test coverage requirements._

| **Portal / Section** | **Pages** | **Primary Audience** |
| --- | --- | --- |
| PUBLIC PORTAL | 21 pages | Accessible to all visitors without login |
| BUYER / USER DASHBOARD | 8 pages | Authenticated buyer experience |
| AGENT PORTAL | 12 pages | Full CRM and listing management for verified agents |
| DEVELOPER PORTAL | 10 pages | NEW — Layer 2 |
| WHATSAPP AUTOMATION PANEL | 6 pages | NEW — Layer 2 |
| SEO ENGINE (OutcomeLabs) | 8 pages | NEW — Layer 3 |
| ADMIN PANEL | 12 pages | Super-admin and admin access only |

**TOTAL: 38 pages**

## **PUBLIC PORTAL (21 pages)**

_Accessible to all visitors without login. SEO-critical — all pages Server-Side Rendered._

| **ID** | **Page Name** | **Key Features & Components** |
| --- | --- | --- |
| PUB-01 | Homepage | Hero search, featured listings, popular cities, how-it-works, CTA, testimonials, blog preview |
| PUB-02 | Property Listings | Full search results with filters (price, type, beds, location, amenities). Pagination + map toggle view |
| PUB-03 | Property Detail | Photo gallery, virtual tour, full description, mortgage calculator, inquiry form, agent card, similar listings |
| PUB-04 | Map Search | Full-screen interactive Mapbox map with listing pins, clustering, sidebar results, filter panel |
| PUB-05 | Agent Directory | Browse verified agents, filter by city/speciality/rating, search by name |
| PUB-06 | Agent Profile | Bio, ratings, active listings, reviews, contact form, social links |
| PUB-07 | Service Directory | Browse real estate service providers by category (legal, architecture, finance, renovation etc.) |
| PUB-08 | Service Provider Profile | Business profile, services list, reviews/ratings, contact, gallery, location |
| PUB-09 | Developer Directory | Browse real estate developers, filter by city/project type/status |
| PUB-10 | Developer Profile | Company profile, active projects, completed projects, contact |
| PUB-11 | Project Detail | Off-plan/estate project page: units, floor plans, price range, gallery, brochure download, enquiry form |
| PUB-12 | Blog / Insights | Real estate market insights, buying guides, investment articles (SEO-optimised) |
| PUB-13 | Blog Post | Individual article with schema markup, social share, related posts, author card |
| PUB-14 | About Us | Company story, mission, team, press mentions, partners |
| PUB-15 | Contact | Contact form, office locations, WhatsApp chat link, support email |
| PUB-16 | Register | User registration: buyer/agent/developer role selection, OTP verification |
| PUB-17 | Login | Email/password + Google OAuth + 'Forgot Password' flow |
| PUB-18 | Reset Password | OTP-gated password reset flow |
| PUB-19 | Pricing / Listing Plans | Agent subscription tiers, listing fee calculator, premium listing comparison |
| PUB-20 | Privacy Policy | NDPA 2023 compliant privacy policy |
| PUB-21 | Terms of Service | Platform terms, agent terms, developer terms |

## **BUYER / USER DASHBOARD (8 pages)**

_Authenticated buyer experience. Route-guarded. Client-side rendered._

| **ID** | **Page Name** | **Key Features & Components** |
| --- | --- | --- |
| BUY-01 | Dashboard Home | Overview: recent searches, saved properties, inquiry status, recommended listings |
| BUY-02 | Saved Properties | All favourited listings with quick-view, remove, share, and inquiry actions |
| BUY-03 | My Inquiries | All sent inquiries with status (new, responded, tour scheduled, closed) |
| BUY-04 | Messages | Real-time in-platform messaging with agents. Thread list + conversation view |
| BUY-05 | Tour Requests | Scheduled property tours: upcoming, past, reschedule, cancel |
| BUY-06 | Saved Searches | Manage saved search filters with email alert toggle and frequency setting |
| BUY-07 | My Profile | Personal details, avatar, contact preferences, notification settings |
| BUY-08 | Notifications | All platform notifications: price drops, new matches, agent replies, tour reminders |

## **AGENT PORTAL (12 pages)**

_Full CRM and listing management for verified agents. Subscription-gated features._

| **ID** | **Page Name** | **Key Features & Components** |
| --- | --- | --- |
| AGT-01 | Agent Dashboard | KPIs: total listings, views this month, leads, conversion rate, revenue |
| AGT-02 | My Listings | All agent listings: status badges, quick-edit, boost, pause, delete |
| AGT-03 | Create Listing | Multi-step listing form: property details → photos → pricing → publish |
| AGT-04 | Edit Listing | Same as Create Listing pre-filled with existing data |
| AGT-05 | Lead Inbox | All buyer inquiries with status, reply, schedule tour, mark closed |
| AGT-06 | Messages | Real-time messaging (shared with BUY-04 thread view) |
| AGT-07 | Analytics | Views per listing, inquiry rate, tour conversion, market comparison charts |
| AGT-08 | Commission Tracker | All transactions, commission earned, pending payments, payout history |
| AGT-09 | KYC Verification | Submit BVN, ID docs, CAC — status tracker — re-submission if rejected |
| AGT-10 | Subscription & Billing | Current plan, upgrade/downgrade, billing history, Paystack checkout |
| AGT-11 | Profile & Settings | Public profile editor, headshot, bio, social links, notification preferences |
| AGT-12 | Referral Programme | Referral link, earnings, leaderboard, payout request |

## **DEVELOPER PORTAL (10 pages)**

_NEW — Layer 2. Dedicated experience for real estate developers managing multiple projects and bulk listings._

| **ID** | **Page Name** | **Key Features & Components** |
| --- | --- | --- |
| DEV-01 | Developer Dashboard | Portfolio overview: total projects, units sold, active inquiries, revenue, leads this month |
| DEV-02 | My Projects | Grid of all developer projects with status (UPCOMING/ONGOING/COMPLETED/SOLD_OUT) |
| DEV-03 | Create Project | Full project creation: name, description, location, unit types, price range, amenities, gallery, docs |
| DEV-04 | Project Detail (Admin) | Manage project: unit inventory, sold units, buyer leads, documents |
| DEV-05 | Bulk Listing Upload | CSV/Excel import for batch listing creation. Template download. Validation report. |
| DEV-06 | Lead Management | All inquiries across all projects. Filter by project, status, date. Assign to sales rep. |
| DEV-07 | Sales Analytics | Project-level analytics: page views, inquiry funnel, conversion rates, revenue charts |
| DEV-08 | KYC & Verification | Developer company verification: RC number, CAC, directors, company documents |
| DEV-09 | Subscription & Billing | Developer plan, featured project slots, billing history |
| DEV-10 | Team Management | Add/remove sales team members, assign projects, manage permissions |

## **WHATSAPP AUTOMATION PANEL (6 pages)**

_NEW — Layer 2. Admin-only panel for monitoring, reviewing, and approving WhatsApp-sourced listings._

| **ID** | **Page Name** | **Key Features & Components** |
| --- | --- | --- |
| WA-01 | Pending Queue | All extracted WhatsApp messages awaiting review. AI confidence score, preview, approve/reject actions |
| WA-02 | Message Detail | Full WhatsApp message, AI-extracted JSON, image thumbnails, edit-before-approve form |
| WA-03 | Approved Listings | All WhatsApp-sourced listings that went live. Link to listing, original message, SEO variants generated |
| WA-04 | Rejected Messages | Rejected messages with reason codes. Option to re-queue. |
| WA-05 | Group Management | Manage monitored WhatsApp groups: add/remove, group name, message count, last activity |
| WA-06 | Automation Settings | Configure AI extraction thresholds, confidence score minimum, auto-approve rules, notification settings |

## **SEO ENGINE (OutcomeLabs) (8 pages)**

_NEW — Layer 3. AI-powered content generation and multi-channel distribution powered by OutcomeLabs methodology._

| **ID** | **Page Name** | **Key Features & Components** |
| --- | --- | --- |
| SEO-01 | SEO Dashboard | Overview: variants generated today, posts scheduled, channel performance, top-performing listings |
| SEO-02 | Variant Generator | Select listing → choose variant types → generate 10 variants → review → approve for posting |
| SEO-03 | Content Calendar | Visual calendar showing scheduled posts across all channels. Drag-to-reschedule. |
| SEO-04 | Channel Manager | Connect and manage posting channels: Twitter/X, LinkedIn, Facebook, Instagram, WhatsApp Broadcast |
| SEO-05 | Post Approval Queue | Variants pending human approval before posting. Edit, approve, reject, reschedule. |
| SEO-06 | Performance Analytics | Engagement per channel per listing variant. Impressions, clicks, inquiry conversions. |
| SEO-07 | SEO Audit Tool | Per-listing SEO score, meta description quality, keyword density, schema markup status |
| SEO-08 | Hashtag Manager | AI-generated hashtag sets by city, property type, target audience. Manage and refresh. |

## **ADMIN PANEL (12 pages)**

_Super-admin and admin access only. Full platform governance, moderation, and reporting._

| **ID** | **Page Name** | **Key Features & Components** |
| --- | --- | --- |
| ADM-01 | Admin Dashboard | Platform KPIs: DAU, MAU, total listings, GMV, new agents, pending verifications |
| ADM-02 | Property Moderation | Review flagged listings, approve/reject new listings, verify property documents |
| ADM-03 | Agent Management | All agents: filter by verification status, subscription plan, activity. Suspend/restore. |
| ADM-04 | KYC Review Queue | Pending agent and developer KYC submissions. Review docs, approve, reject with reason. |
| ADM-05 | Developer Management | All registered developers: project count, verification status, suspend/restore |
| ADM-06 | User Management | All users: filter by role, status, registration date. View profile, suspend, delete. |
| ADM-07 | Payments & Revenue | All transactions, Paystack webhooks log, commission splits, subscription revenue |
| ADM-08 | Service Directory Mgmt | Approve/reject service provider listings, featured slots management |
| ADM-09 | WhatsApp Automation | Bridge health status, extraction success rate, pending queue count (links to WA-01) |
| ADM-10 | SEO Engine Control | API usage/cost tracking, variant generation logs, posting channel status |
| ADM-11 | Audit Log | All admin actions: who did what, when, from which IP |
| ADM-12 | System Settings | Feature flags, email templates, platform configuration, maintenance mode |

# **3\. Feature Registry — 127 Features Across 12 Modules**

_Every feature has a unique ID, module owner, priority, target sprint, and architecture layer. P0 = launch blocker · P1 = launch goal · P2 = post-launch sprint · P3 = Phase 2._

## **3.1 Feature Count by Module**

| **Module** | **Count** | **Notes** |
| --- | --- | --- |
| auth | 8   | 7 P0 launch blockers |
| listings | 8   | 3 P0 launch blockers |
| search | 7   | 5 P0 launch blockers |
| agents | 8   | 4 P0 launch blockers |
| payments | 7   | 3 P0 launch blockers |
| messaging | 6   | 3 P0 launch blockers |
| directory | 4   | 0 P0 launch blockers |
| whatsapp | 11  | 8 P0 launch blockers |
| developers | 10  | 5 P0 launch blockers |
| seo | 14  | 9 P0 launch blockers |
| ai  | 8   | 4 P0 launch blockers |

**TOTAL FEATURES: 127 P0 Launch Blockers: 51**

## **3.2 Full Feature Registry**

| **ID** | **Feature** | **Module** | **Priority** | **Sprint** | **Layer** |
| --- | --- | --- | --- | --- | --- |
| F-001 | Email + Password Registration | auth | **P0** | 2   | L1  |
| F-002 | OTP Verification (SMS via Termii + Email via SES) | auth | **P0** | 2   | L1  |
| F-003 | Google OAuth 2.0 Login | auth | **P0** | 2   | L1  |
| F-004 | JWT RS256 Access + Refresh Token | auth | **P0** | 2   | L1  |
| F-005 | Role-Based Access Control (buyer, agent, developer, admin) | auth | **P0** | 2   | L1  |
| F-006 | Password Reset (OTP-gated) | auth | **P0** | 2   | L1  |
| F-007 | Session Management + Token Revocation | auth | **P1** | 2   | L1  |
| F-008 | Brute Force Protection (Redis rate limit, 5 fails = 15 min lockout) | auth | **P0** | 2   | L1  |
| F-010 | Property CRUD (Create, Read, Update, Soft Delete) | listings | **P0** | 3   | L1  |
| F-011 | Multi-Image Upload (S3 + Sharp resize + WebP conversion, max 20) | listings | **P0** | 3   | L1  |
| F-012 | Property Status Management (draft, active, sold, pending, paused) | listings | **P0** | 3   | L1  |
| F-013 | Listing Expiry (90-day default, renewal notification) | listings | **P1** | 3   | L1  |
| F-014 | Listing Boost (featured placement, 7-day) | listings | **P1** | 5   | L1  |
| F-015 | Virtual Tour URL Embed (YouTube/Matterport link) | listings | **P2** | 6   | L1  |
| F-016 | Floor Plan Upload | listings | **P2** | 6   | L1  |
| F-017 | Price History Tracking | listings | **P2** | 7   | L1  |
| F-020 | Full-Text Elasticsearch Search with Autocomplete | search | **P0** | 3   | L1  |
| F-021 | Faceted Filters (price, beds, baths, type, amenities) | search | **P0** | 3   | L1  |
| F-022 | PostGIS Geospatial: Radius Search + Bounding Box | search | **P0** | 3   | L1  |
| F-023 | Map-Based Search (Mapbox GL JS, clustering) | search | **P0** | 3   | L1  |
| F-024 | Saved Searches with Email Alerts | search | **P1** | 5   | L1  |
| F-025 | Recently Viewed Properties | search | **P1** | 5   | L1  |
| F-026 | Sort by Price / Date / Popularity | search | **P0** | 3   | L1  |
| F-030 | Agent Public Profile Page | agents | **P0** | 4   | L1  |
| F-031 | BVN/KYC Verification via Dojah API | agents | **P0** | 4   | L1  |
| F-032 | Agent Verification Badge | agents | **P0** | 4   | L1  |
| F-033 | Lead Management Inbox (CRM-lite) | agents | **P0** | 4   | L1  |
| F-034 | Agent Analytics Dashboard (views, inquiries, conversion) | agents | **P1** | 5   | L1  |
| F-035 | Commission Tracker + Payout History | agents | **P1** | 5   | L1  |
| F-036 | Referral Programme (link, earnings, leaderboard) | agents | **P2** | 7   | L1  |
| F-037 | Bulk CSV Listing Upload | agents | **P1** | 5   | L1  |
| F-040 | Paystack Agent Subscription Billing (monthly/annual) | payments | **P0** | 4   | L1  |
| F-041 | Paystack Payment Gateway (card, bank transfer, USSD) | payments | **P0** | 4   | L1  |
| F-042 | Webhook Handler (HMAC-SHA512 verified) | payments | **P0** | 4   | L1  |
| F-043 | Flutterwave Fallback Integration | payments | **P1** | 5   | L1  |
| F-044 | Listing Boost Payment (₦25,000 / 7 days) | payments | **P1** | 5   | L1  |
| F-045 | Wallet System (commission credits) | payments | **P2** | 7   | L1  |
| F-046 | Stripe for Diaspora USD/GBP (Phase 2) | payments | **P3** | 8+  | L1  |
| F-050 | Real-Time In-Platform Messaging (Socket.io + JWT auth) | messaging | **P0** | 5   | L1  |
| F-051 | Email Notifications (AWS SES — inquiry, tour, digest) | messaging | **P0** | 5   | L1  |
| F-052 | SMS Notifications (Termii — OTP, inquiry alerts) | messaging | **P0** | 2   | L1  |
| F-053 | Push Notifications (Phase 2 — FCM) | messaging | **P3** | 8+  | L1  |
| F-054 | Tour Scheduling (in-person + virtual request) | messaging | **P1** | 5   | L1  |
| F-055 | WhatsApp Click-to-Chat (button on agent profile) | messaging | **P1** | 4   | L1  |
| F-060 | Service Provider Listing (free + premium) | directory | **P1** | 5   | L1  |
| F-061 | Service Provider Categories (8 types) | directory | **P1** | 5   | L1  |
| F-062 | Customer Reviews & Ratings (Polymorphic) | directory | **P1** | 6   | L1  |
| F-063 | SEO-Optimised Service Provider Profiles | directory | **P2** | 7   | L1  |
| F-070 | Baileys/Evolution API Bridge Webhook Ingestion | whatsapp | **P0** | 3   | L2  |
| F-071 | Raw Message Storage (RawWhatsAppMessages table) | whatsapp | **P0** | 3   | L2  |
| F-072 | BullMQ Extraction Queue (whatsapp-extraction-queue) | whatsapp | **P0** | 3   | L2  |
| F-073 | AI Extraction Job (Claude 3.5 / Grok → structured JSON) | whatsapp | **P0** | 3   | L2  |
| F-074 | Confidence Score Calculation + Threshold Filter | whatsapp | **P0** | 4   | L2  |
| F-075 | Pending Queue Admin Dashboard (WA-01) | whatsapp | **P0** | 4   | L2  |
| F-076 | Human-in-Loop Approve / Edit / Reject Flow | whatsapp | **P0** | 4   | L2  |
| F-077 | Auto-Create Listing + Property on Approval | whatsapp | **P0** | 4   | L2  |
| F-078 | Duplicate Detection (same address + agent within 24h) | whatsapp | **P1** | 5   | L2  |
| F-079 | WhatsApp Group Manager (add/remove monitored groups) | whatsapp | **P1** | 5   | L2  |
| F-080 | Auto-Approve Rules (high confidence + trusted sender) | whatsapp | **P2** | 7   | L2  |
| F-090 | Developer Company Registration + KYC (RC number, CAC) | developers | **P0** | 5   | L2  |
| F-091 | Developer Project CRUD | developers | **P0** | 5   | L2  |
| F-092 | Project Unit Inventory Management | developers | **P0** | 5   | L2  |
| F-093 | Project Status Lifecycle (UPCOMING/ONGOING/COMPLETED/SOLD_OUT) | developers | **P0** | 5   | L2  |
| F-094 | Bulk Listing Upload (CSV/Excel with validation report) | developers | **P1** | 6   | L2  |
| F-095 | Developer Lead Management (multi-project CRM view) | developers | **P1** | 6   | L2  |
| F-096 | Sales Team Management (add reps, assign projects) | developers | **P1** | 6   | L2  |
| F-097 | Project Analytics (views, inquiries, conversion funnel) | developers | **P2** | 7   | L2  |
| F-098 | Brochure/Document Upload (PDF, floor plans) | developers | **P1** | 6   | L2  |
| F-099 | Project Public Detail Page (PUB-11) | developers | **P0** | 5   | L2  |
| F-100 | AI SEO Variant Generator (10 variants per listing) | seo | **P0** | 6   | L3  |
| F-101 | Variant Types: luxury, investment, family, diaspora, social, urgency | seo | **P0** | 6   | L3  |
| F-102 | SEO Title + Meta Description Generation | seo | **P0** | 6   | L3  |
| F-103 | Long-Form Listing Copy Generation | seo | **P0** | 6   | L3  |
| F-104 | Hashtag Set Generator (city + type + audience) | seo | **P0** | 6   | L3  |
| F-105 | Social Media Caption Generator (Twitter/X, LinkedIn, Facebook, Instagram) | seo | **P0** | 6   | L3  |
| F-106 | Schema.org Structured Data Injection (RealEstateListing) | seo | **P0** | 6   | L3  |
| F-107 | Content Calendar (visual scheduling UI) | seo | **P1** | 7   | L3  |
| F-108 | Multi-Channel Auto-Posting (Facebook, LinkedIn, Twitter/X) | seo | **P1** | 7   | L3  |
| F-109 | WhatsApp Broadcast Post Scheduling | seo | **P1** | 7   | L3  |
| F-110 | Human Approval Gate (Post Approval Queue — SEO-05) | seo | **P0** | 6   | L3  |
| F-111 | SEO Audit Tool (per-listing score, keyword density) | seo | **P2** | 7   | L3  |
| F-112 | Variant Performance Analytics (engagement → inquiry tracking) | seo | **P2** | 8   | L3  |
| F-113 | Auto-Trigger SEO Generation on Listing Approval | seo | **P0** | 6   | L3  |
| F-120 | FastAPI AI Service (Python, separate deployment) | ai  | **P0** | 3   | L2  |
| F-121 | /extract-listing endpoint (Claude 3.5 Sonnet) | ai  | **P0** | 3   | L2  |
| F-122 | /generate-seo-variants endpoint (Grok / GPT-4o / Claude) | ai  | **P0** | 6   | L3  |
| F-123 | LangChain Prompt Management + Output Parsing | ai  | **P1** | 4   | L2  |
| F-124 | Rate Limiting + Cost Tracking per Request | ai  | **P0** | 4   | L2  |
| F-125 | /property-valuation endpoint (Phase 2 stub) | ai  | **P3** | 8+  | L2  |
| F-126 | AI Request Audit Log (prompt, response, tokens, cost) | ai  | **P1** | 4   | L2  |
| F-127 | Fallback Model Chain (primary fails → secondary model) | ai  | **P2** | 7   | L2  |

# **4\. Database Schema — 24 Tables**

_Full Prisma schema. PostgreSQL with PostGIS extension. All monetary values in kobo (integer). All PKs are UUID. Soft deletes via deletedAt._

## **4.1 Schema Rules (Non-Negotiable)**

- ALL monetary values stored as BIGINT in kobo (₦1 = 100 kobo). Never FLOAT or DECIMAL for money.
- ALL PKs are UUID (@default(uuid())). Never auto-increment integers — prevents enumeration attacks.
- ALL timestamps use TIMESTAMPTZ. Store UTC, display in user's local timezone on frontend.
- BVN and NIN stored as SHA-256 hash + salt ONLY. Never plaintext. Verified via Dojah API.
- Soft deletes on all user-facing tables via deletedAt TIMESTAMPTZ. Never hard-delete user data.
- geom columns (GEOGRAPHY(POINT)) have mandatory GIST index — required for map search performance.
- price_range stored as two BIGINT columns (priceRangeMin, priceRangeMax) — not JSON.

## **4.2 Table Registry**

| **Table Name** | **Module** | **Key Notes** |
| --- | --- | --- |
| users | auth | Central identity table. Role: buyer \| agent \| developer \| admin \| super_admin \| service_provider |
| user_profiles | users | Extended profile data. 1:1 with users. |
| agents | agents | BVN stored as SHA-256 hash. Never plain text. |
| developers | developers | Developer company entity. RC number for CAC verification. |
| developer_team_members | developers | Sales team members for developer companies. |
| properties | listings | geom column has GIST index for PostGIS. PropertyType: apartment\|house\|land\|commercial\|estate_unit |
| listings | listings | Price in kobo (₦1=100 kobo). status: draft\|active\|paused\|sold\|expired |
| listing_images | listings | Max 20 images per listing. isPrimary = hero image. |
| listing_features | listings | M2M. Features: pool\|gym\|generator\|security\|borehole\|solar\|parking\|elevator |
| saved_searches | search | Stores serialised Elasticsearch filter object. |
| inquiries | agents | source: web\|whatsapp\|direct. status: new\|responded\|touring\|closed\|lost |
| tour_requests | agents | tourType: in_person\|virtual. status: pending\|confirmed\|completed\|cancelled |
| reviews | agents | Polymorphic. targetType: agent\|listing\|service_provider\|developer |
| subscriptions | payments | Paystack subscription. plans: agent_basic\|agent_pro\|developer_basic\|developer_pro |
| payments | payments | type: subscription\|listing_boost\|service_listing\|escrow. gateway: paystack\|flutterwave\|stripe |
| messages | messaging | Socket.io delivers real-time. threadId groups conversation. |
| service_providers | directory | category: legal\|mortgage\|architecture\|survey\|insurance\|renovation\|photography\|property_management |
| raw_whatsapp_messages | whatsapp | status: PENDING\|PROCESSED\|APPROVED\|REJECTED\|FAILED\|DUPLICATE |
| developer_projects | developers | status: UPCOMING\|ONGOING\|COMPLETED\|SOLD_OUT |
| project_units | developers | status: available\|reserved\|sold. Tracks unit-level inventory. |
| listing_seo_variants | seo | status: draft\|approved\|scheduled\|posted\|rejected. channel: web\|facebook\|twitter\|linkedin\|instagram\|whatsapp |
| seo_posting_schedule | seo | Tracks multi-channel posting schedule and outcome. |
| ai_request_log | ai  | Cost tracking for AI budget management. Alert when daily spend > threshold. |
| audit_log | auth | Append-only. All admin actions, KYC decisions, payment events logged. |

## **4.3 Critical Indexes**

| **Table.Column(s)** | **Index Type** | **Why It's Needed** |
| --- | --- | --- |
| properties.geom | GIST | All map/radius/bbox searches. WITHOUT this, geo search is full table scan. |
| developer_projects.geom | GIST | Project location search on map. |
| listings.status + price | BTREE composite | Most common search filter pair. |
| listings.agentId | BTREE | Agent's listing management dashboard. |
| listings.isFeatured + expiresAt | BTREE composite | Homepage featured listings query. |
| raw_whatsapp_messages.status | BTREE | Pending queue filter in WA-01 admin page. |
| raw_whatsapp_messages.messageId | UNIQUE BTREE | Duplicate message detection. |
| listing_seo_variants.listingId | BTREE | All variants for a listing (Variant Generator page). |
| listing_seo_variants.status + scheduledAt | BTREE composite | Content Calendar query for scheduled posts. |
| users.email | UNIQUE BTREE | Login lookup and uniqueness enforcement. |
| inquiries.listingId | BTREE | Lead inbox per listing. |
| audit_log.actorId + createdAt | BTREE composite | User activity history in admin audit log. |

# **5\. OutcomeLabs SEO Automation Engine — Detailed Design**

## **5.1 What OutcomeLabs Brings**

OutcomeLabs is a specialist AI-content-to-distribution methodology. For LandShoppers, their approach transforms every property listing into a multi-channel content asset. Instead of one static listing page, each property generates 10+ content variants optimised for different audiences, channels, and search intents — all automatically, with a human approval gate before posting.

## **5.2 The SEO Engine Pipeline**

| **Step** | **Stage** | **Detail** |
| --- | --- | --- |
| 1   | Trigger | Listing is approved by admin OR WhatsApp message approved in WA-02. Event fires: listing.approved |
| 2   | Queue | seo-generation-queue (BullMQ) receives job with {listingId, triggerSource} |
| 3   | Data Fetch | AI Service fetches full listing data: title, price, beds, baths, location, agent name, features, images |
| 4   | Variant Generation | POST /generate-seo-variants to FastAPI AI Service. Returns 10 structured variants in JSON. |
| 5   | Storage | All 10 variants saved to listing_seo_variants table with status='draft' |
| 6   | Admin Notification | Admin + Content team notified: '10 SEO variants ready for review for \[Listing Title\]' |
| 7   | Human Review | SEO-05 Post Approval Queue. Editor reviews each variant, edits if needed, approves or rejects. |
| 8   | Scheduling | Approved variants added to seo_posting_schedule with channel + scheduledAt datetime. |
| 9   | Auto-Posting | seo-posting-queue fires at scheduledAt. Posts via platform API (Facebook Graph, Twitter v2, LinkedIn). |
| 10  | Tracking | Post ID stored in seo_posting_schedule.externalPostId. Engagement polled every 6h for 7 days. |
| 11  | Analytics | SEO-06 Performance Analytics shows: impressions, clicks, profile visits, inquiry conversions per variant. |

## **5.3 The 10 Variant Types**

| **Variant** | **Target Audience** | **Tone & Angle** |
| --- | --- | --- |
| luxury | High-net-worth buyers | Aspirational, premium language. Emphasises prestige, exclusivity, finishes. |
| investment | Property investors | ROI-first. Rental yield estimates, capital appreciation, market data. |
| family | Young families, first-time buyers | Warm, practical. Schools nearby, security, community, space. |
| diaspora | Nigerians abroad (UK, US, Canada) | Trust-building. Easy remote purchase process, verified agent, secure payment. |
| urgency | Active buyers, price-sensitive | Scarcity + deadline language. Limited units, price recently dropped. |
| social_x | Twitter/X audience | Punchy, 280 chars max, with 3–5 hashtags. Hook in first 5 words. |
| social_li | LinkedIn professionals | Professional tone, investment angle, market insight framing. |
| social_fb | Facebook / Instagram | Warm, visual-first caption. Call-to-action. Emoji-friendly. |
| whatsapp | WhatsApp broadcast list | Short, conversational. Reads like a message from a trusted contact. |
| seo_long | Google search | 1000+ word SEO-optimised listing copy. Schema markup. Keywords in title + first para. |

## **5.4 AI Service — SEO Variant Generation Endpoint**

### **POST /generate-seo-variants**

**Request payload:**

- listingId: UUID of the approved listing
- count: 10 (number of variants — always 10 for Phase 1)
- variantTypes: array of 10 types listed above
- listingData: full listing object including location, price, features, agent name

**AI Model Chain:**

- Primary: Claude 3.5 Sonnet (Anthropic) — best structured JSON output for Nigerian property context
- Fallback 1: Grok (xAI) — activated if Claude rate-limited or unavailable
- Fallback 2: GPT-4o (OpenAI) — final fallback

**Response schema (per variant):**

- variantType: string
- seoTitle: 60 characters max
- metaDescription: 160 characters max
- hashtags: array of 10–15 hashtags
- fullCopy: 200–1200 words depending on type
- socialCaption: platform-appropriate shortened version
- tone: detected/applied tone descriptor
- targetAudience: who this is written for

## **5.5 Multi-Channel Posting Architecture**

| **Channel** | **API / Method** | **Notes** |
| --- | --- | --- |
| Facebook Page | Facebook Graph API v19 | Post to developer/agent Facebook page. Requires Page access token (long-lived). |
| Instagram | Instagram Graph API | Image post with caption. Requires linked Facebook Business account. |
| Twitter / X | Twitter API v2 | Tweet with listing URL. 280-char social_x variant. Requires OAuth 2.0 PKCE. |
| LinkedIn | LinkedIn Share API v2 | Article-style post with social_li variant. Company page or personal. |
| WhatsApp Broadcast | Evolution API / Baileys | Send whatsapp variant to broadcast list. Same bridge used for ingestion. |
| LandShoppers Web | Internal API | seo_long variant populates listing detail page SEO fields automatically. |

**HUMAN-IN-LOOP IS MANDATORY** No variant is posted to any external channel without passing through the SEO-05 Post Approval Queue. Automated posting without human review is OFF by default and requires explicit admin activation per channel. This protects the platform's brand.

# **6\. WhatsApp Automation Pipeline — Detailed Design**

## **6.1 Architecture Overview**

The WhatsApp automation system monitors designated LandShoppers WhatsApp groups, extracts property listing data from messages using AI, and routes extracted listings through a human approval workflow before going live on the platform. This creates a zero-friction pipeline for agents who share listings via WhatsApp.

## **6.2 Component Stack**

| **Component** | **Technology** | **Role** |
| --- | --- | --- |
| Bridge (WhatsApp Connector) | Evolution API v2 (preferred) or Baileys | Self-hosted. Connects real WhatsApp number to webhook. Forwards all group messages. |
| Webhook Receiver | Node.js Express endpoint | POST /api/v1/whatsapp/webhook. Validates HMAC secret. Saves to raw_whatsapp_messages. |
| Extraction Queue | BullMQ (whatsapp-extraction-queue) | Jobs processed concurrently: 3 workers. Each job calls AI extraction service. |
| AI Extraction Service | FastAPI Python / Claude 3.5 Sonnet | Extracts: title, price, beds, baths, location, agent name, description from raw text. |
| Approval Dashboard | Next.js Admin Panel (WA-01, WA-02) | Human reviewer sees extracted JSON, edits if needed, approves or rejects. |
| Listing Creation Worker | Node.js service | On approval: creates Property + Listing records, fires SEO generation event. |

## **6.3 Step-By-Step Flow**

1.  Agent posts property in monitored WhatsApp group (text + optional images).
2.  Evolution API bridge captures message → POST to /api/v1/whatsapp/webhook.
3.  Webhook validates HMAC-SHA256 secret header. Rejects unsigned requests with 401.
4.  Message saved to raw_whatsapp_messages table with status=PENDING.
5.  BullMQ job added to whatsapp-extraction-queue with {messageId}.
6.  Worker picks up job → fetches raw message → POST to AI Service /extract-listing.
7.  AI returns: { title, price, bedrooms, bathrooms, location, description, agentPhone, confidence }.
8.  extractedData + confidenceScore saved to raw_whatsapp_messages. Status → PROCESSED.
9.  If confidenceScore < 0.70 → status = FAILED, admin notified for manual review.
10. If confidenceScore >= 0.70 → status = PROCESSED, appears in WA-01 Pending Queue.
11. Admin reviews WA-02 Message Detail: sees original text, AI JSON, images side by side.
12. Admin edits any incorrect fields, clicks APPROVE.
13. Status → APPROVED. Listing creation worker fires.
14. Property + Listing records created in PostgreSQL. Status = active.
15. Event fires: listing.approved → SEO Engine pipeline starts (Section 5).
16. Admin sees listing live on platform within 60 seconds of approval.

## **6.4 AI Extraction Prompt Design**

**EXTRACTION PROMPT STRATEGY** The prompt uses Claude 3.5 Sonnet with strict JSON-only output mode. It includes Nigerian real estate context (Lekki, VI, Ajah, Ikoyi prices), local terminology (self-con, 1-bedroom flat, boys quarter), and handles pidgin and mixed Yoruba/English messages. LangChain manages prompt versioning.

**Extracted JSON structure:**

- title: Generated from available info (e.g. '3 Bedroom Flat, Lekki Phase 1')
- price: Numeric value in Naira (handle '45m', '45 million', '₦45,000,000' all → 45000000)
- bedrooms: Integer
- bathrooms: Integer
- toilets: Integer
- propertyType: apartment|house|land|commercial — inferred from message
- location: Street address or area name as stated
- city: Inferred (Lagos, Abuja, PH, etc.)
- state: Inferred
- description: Clean version of the listing text
- agentPhone: Extracted from message or sender phone
- agentName: From sender name or message signature
- amenities: Array of detected amenities (pool, gym, generator, etc.)
- confidence: 0.0–1.0 score of extraction quality
- flags: Array of issues found (e.g. 'price_ambiguous', 'location_incomplete')

## **6.5 Evolution API Bridge Deployment**

- Deploy Evolution API v2 on Railway or DigitalOcean Droplet (minimum 2GB RAM).
- Use a dedicated Nigerian SIM for the WhatsApp number (not the business's primary number).
- Configure webhook URL to: https://api.landshopper.com/api/v1/whatsapp/webhook
- Set WEBHOOK_SECRET in Evolution API config — must match backend WHATSAPP_WEBHOOK_SECRET env var.
- Enable message forwarding for: text, image, video, document message types.
- Monitor bridge health via /api/v1/whatsapp/health endpoint. Alert if disconnected > 5 minutes.

# **7\. Unified Sprint Plan — 8 Sprints · 16 Weeks**

## **7.1 Sprint Summary**

| **Sprint** | **Weeks** | **Theme** | **Key Deliverable** |
| --- | --- | --- | --- |
| Sprint 1 | 1–2 | Foundation, Infrastructure & Monorepo | Turborepo monorepo setup (apps: web, api, ai-service; packag… |
| Sprint 2 | 3–4 | Authentication, RBAC & User Management | JWT RS256 auth: register, login, refresh token, revocation… |
| Sprint 3 | 5–6 | Property Listings, Search & WhatsApp Ingestion | Property CRUD API + image upload (S3 + Sharp + WebP)… |
| Sprint 4 | 7–8 | Agents, KYC, Payments & AI Extraction | Dojah BVN/NIN verification API integration + CAC lookup… |
| Sprint 5 | 9–10 | Messaging, Developer Portal & WhatsApp Approval UI | Socket.io real-time messaging (JWT auth on connection). Thre… |
| Sprint 6 | 11–12 | SEO Engine, Admin Panel & Service Directory | Claude 3.5 prompt for SEO variants. 10 variant types. JSON o… |
| Sprint 7 | 13–14 | Content Calendar, Analytics, Referrals & Polish | Content Calendar (SEO-03): visual drag-to-schedule UI for al… |
| Sprint 8 | 15–16 | QA, Security Hardening & Production Launch | Full E2E Playwright suite: all 10 critical user journeys pas… |

## **7.2 Sprint Story Detail**

### **Sprint 1 (Weeks 1–2) — Foundation, Infrastructure & Monorepo**

| **Ticket** | **Assignee** | **Story** | **Points** |
| --- | --- | --- | --- |
| LAND-001 | Chidi+Emeka | Turborepo monorepo setup (apps: web, api, ai-service; packages: db, ui, utils) | 8   |
| LAND-002 | Emeka | Terraform: provision AWS (RDS PostgreSQL/PostGIS, ECS Fargate, S3, ElastiCache, OpenSearch) | 13  |
| LAND-003 | Emeka | GitHub Actions CI/CD pipeline: lint → test → build → staging deploy → prod (blue/green) | 8   |
| LAND-004 | Chidi | Prisma schema v1: all 24 tables, migrations, seed script (8 properties, 6 agents, 6 providers) | 13  |
| LAND-005 | Emeka | Docker Compose for local dev (postgres+postgis, redis, elasticsearch, evolution-api) | 5   |
| LAND-006 | Fatima | Sentry, Datadog, Snyk baseline config. Security posture report Day 1. | 5   |
| LAND-007 | Kelechi | Design system: Figma token library, component inventory, green+gold palette tokens in Tailwind | 5   |
| LAND-008 | Temi | Linear project configuration, sprint board, client access, Definition of Done published | 3   |

### **Sprint 2 (Weeks 3–4) — Authentication, RBAC & User Management**

| **Ticket** | **Assignee** | **Story** | **Points** |
| --- | --- | --- | --- |
| LAND-010 | Chidi+Emeka | JWT RS256 auth: register, login, refresh token, revocation | 13  |
| LAND-011 | Emeka | OTP verification: Termii (SMS) + AWS SES (email). 5-minute expiry. | 8   |
| LAND-012 | Emeka | Google OAuth 2.0 (Passport.js). Role selection post-OAuth. | 5   |
| LAND-013 | Emeka | RBAC middleware: buyer\|agent\|developer\|admin\|super_admin roles on all routes | 8   |
| LAND-014 | Amara | Auth pages: Login, Register (role select), OTP verify, Reset Password | 8   |
| LAND-015 | Amara | Route guards: protect dashboard, agent portal, developer portal, admin panel | 5   |
| LAND-016 | Kelechi | Auth page designs: brand-consistent, mobile-first, WCAG AA | 3   |
| LAND-017 | Fatima | Auth test suite: unit + integration. Brute force, token replay, OTP expiry tests. | 8   |

### **Sprint 3 (Weeks 5–6) — Property Listings, Search & WhatsApp Ingestion**

| **Ticket** | **Assignee** | **Story** | **Points** |
| --- | --- | --- | --- |
| LAND-020 | Emeka | Property CRUD API + image upload (S3 + Sharp + WebP) | 8   |
| LAND-021 | Emeka | OpenSearch index + listing sync queue (BullMQ). Full-text search API. | 13  |
| LAND-022 | Chidi | PostGIS geospatial: radius + bounding box + polygon search API | 8   |
| LAND-023 | Amara | Listings page: search, filters, map toggle — connected to real OpenSearch API | 8   |
| LAND-024 | Amara | Property detail page: gallery, inquiry form, mortgage calculator | 5   |
| LAND-025 | Kelechi | Mapbox GL JS: interactive map, clustering, sidebar results | 8   |
| LAND-026 | Emeka | WhatsApp webhook receiver: validation, raw_whatsapp_messages storage | 5   |
| LAND-027 | Emeka | FastAPI AI Service scaffold: Docker deploy, /health, /extract-listing stub | 8   |
| LAND-028 | Fatima | Search API test suite. Geo-search accuracy validation. Webhook signature tests. | 5   |

### **Sprint 4 (Weeks 7–8) — Agents, KYC, Payments & AI Extraction**

| **Ticket** | **Assignee** | **Story** | **Points** |
| --- | --- | --- | --- |
| LAND-030 | Emeka | Dojah BVN/NIN verification API integration + CAC lookup | 8   |
| LAND-031 | Emeka | Paystack: agent subscriptions (basic/pro plans) + listing boost payment | 13  |
| LAND-032 | Emeka | Paystack webhook handler (HMAC-SHA512 verified). Idempotent processing. | 8   |
| LAND-033 | Emeka | BullMQ whatsapp-extraction-queue: workers, retry logic, dead letter queue | 8   |
| LAND-034 | Chidi | Claude 3.5 Sonnet extraction prompt + LangChain output parser. Confidence scoring. | 13  |
| LAND-035 | Amara | Agent dashboard: lead inbox, listings management, KYC status, subscription page | 8   |
| LAND-036 | Amara | Agent KYC submission UI: document upload, status tracker | 5   |
| LAND-037 | Fatima | Payment security audit. Webhook replay test. KYC edge cases (unverified BVN). | 8   |

### **Sprint 5 (Weeks 9–10) — Messaging, Developer Portal & WhatsApp Approval UI**

| **Ticket** | **Assignee** | **Story** | **Points** |
| --- | --- | --- | --- |
| LAND-040 | Emeka | Socket.io real-time messaging (JWT auth on connection). Thread management. | 8   |
| LAND-041 | Emeka | AWS SES email notifications: inquiry, tour, saved search digest, listing expiry | 5   |
| LAND-042 | Amara | Messaging UI: thread list + real-time conversation view (BUY-04 + AGT-06) | 8   |
| LAND-043 | Emeka | Developer Portal API: project CRUD, unit inventory, team management | 8   |
| LAND-044 | Amara | Developer portal pages: DEV-01 through DEV-06 (dashboard to lead management) | 13  |
| LAND-045 | Amara | WhatsApp Pending Queue (WA-01) + Message Detail + Approve/Reject (WA-02) | 8   |
| LAND-046 | Chidi | Listing creation worker: on WA approval → create Property + Listing records | 5   |
| LAND-047 | Fatima | Socket.io security tests. XSS in message body. Developer portal access control. | 5   |

### **Sprint 6 (Weeks 11–12) — SEO Engine, Admin Panel & Service Directory**

| **Ticket** | **Assignee** | **Story** | **Points** |
| --- | --- | --- | --- |
| LAND-050 | Chidi | Claude 3.5 prompt for SEO variants. 10 variant types. JSON output schema. | 13  |
| LAND-051 | Emeka | seo-generation-queue + BullMQ workers. Auto-trigger on listing.approved event. | 8   |
| LAND-052 | Emeka | Facebook Graph, Twitter v2, LinkedIn posting API integrations | 8   |
| LAND-053 | Amara | SEO Engine UI: SEO-01 dashboard, SEO-02 variant generator, SEO-05 approval queue | 13  |
| LAND-054 | Amara | Admin panel: ADM-01 through ADM-08 (all core admin pages) | 13  |
| LAND-055 | Amara | Service directory pages: PUB-07 + PUB-08 + provider submission form | 5   |
| LAND-056 | Kelechi | WCAG 2.1 AA audit on all public pages. Remediation pass. | 5   |
| LAND-057 | Fatima | SEO posting pipeline tests. Facebook API mock tests. Admin privilege escalation. | 5   |

### **Sprint 7 (Weeks 13–14) — Content Calendar, Analytics, Referrals & Polish**

| **Ticket** | **Assignee** | **Story** | **Points** |
| --- | --- | --- | --- |
| LAND-060 | Amara | Content Calendar (SEO-03): visual drag-to-schedule UI for all channels | 8   |
| LAND-061 | Amara | Channel Manager (SEO-04): connect/disconnect social accounts, test post | 5   |
| LAND-062 | Amara | SEO Performance Analytics (SEO-06): engagement → inquiry conversion tracking | 8   |
| LAND-063 | Amara | WhatsApp group manager (WA-05) + Automation settings (WA-06) | 5   |
| LAND-064 | Amara | Developer analytics (DEV-07) + Sales team management (DEV-10) | 5   |
| LAND-065 | Amara | Referral programme (AGT-12): link generator, leaderboard, payout request | 5   |
| LAND-066 | Emeka | WhatsApp broadcast posting via Evolution API (SEO variant → broadcast list) | 5   |
| LAND-067 | Fatima | Load test (k6): 500 concurrent users on /api/v1/listings/search. p99 < 800ms. | 8   |
| LAND-068 | Chidi | AI fallback chain: Grok fallback if Claude rate-limited. Cost tracking alerts. | 5   |

### **Sprint 8 (Weeks 15–16) — QA, Security Hardening & Production Launch**

| **Ticket** | **Assignee** | **Story** | **Points** |
| --- | --- | --- | --- |
| LAND-070 | Fatima | Full E2E Playwright suite: all 10 critical user journeys passing | 13  |
| LAND-071 | Fatima | OWASP ZAP DAST scan. NDPA compliance review. Pen test report. | 8   |
| LAND-072 | Fatima | Full security checklist: HSTS, CSP headers, cookie flags, dependency audit | 5   |
| LAND-073 | Emeka | Performance optimisation: CDN tuning, Redis cache layer, DB query analysis | 8   |
| LAND-074 | Amara | Core Web Vitals final pass: LCP < 2.0s on 3G. Lighthouse CI all green. | 8   |
| LAND-075 | Emeka | Paystack live mode activation. End-to-end payment smoke test in production. | 5   |
| LAND-076 | Emeka | Evolution API bridge production deploy + WhatsApp group monitoring go-live. | 5   |
| LAND-077 | Temi | UAT with client: all acceptance criteria sign-off. Go/No-Go checklist. | 5   |
| LAND-078 | All | Blue/green production deployment. Monitoring dashboards live. Launch! | 8   |

# **8\. Development Start Checklist — Week 1 Actions**

_Every item below must be completed before Sprint 1 Day 3. Temi Lawson tracks completion daily._

## **8.1 Access & Credentials (Client Provides)**

|     | **Item** | **Owner** | **Due** |
| --- | --- | --- | --- |
| 1   | Existing codebase repository access (GitHub invite to Stacklane team) | Client | Day 1 |
| 2   | Paystack API keys (test + live) + Business account access | Client | Day 1 |
| 3   | Mapbox API token (public token for frontend) | Client | Day 1 |
| 4   | Dojah API key (BVN/NIN verification) | Client | Day 2 |
| 5   | Domain name confirmation (landshopper.com or .ng) + DNS access | Client | Day 2 |
| 6   | WhatsApp number (SIM) for Evolution API bridge | Client | Day 3 |
| 7   | Social media accounts for SEO posting (Facebook Page, Twitter, LinkedIn) | Client | Week 2 |
| 8   | AI API key (Anthropic Claude) for extraction + SEO generation | Client | Day 2 |

## **8.2 Stacklane Team Actions (Week 1)**

|     | **Action** | **Owner** | **Due** |
| --- | --- | --- | --- |
| 1   | Clone existing repo. Audit codebase. Produce gap analysis report. | Chidi | Day 2 |
| 2   | Create GitHub org: landshopper. Set branch protection on main + develop. | Emeka | Day 1 |
| 3   | Provision AWS dev account. Set up VPC, subnets, security groups. | Emeka | Day 2 |
| 4   | Create Turborepo monorepo structure. Configure workspaces. | Chidi | Day 2 |
| 5   | Write Prisma schema (all 24 tables). First migration. Seed script. | Chidi | Day 3 |
| 6   | Configure Docker Compose for local dev environment. | Emeka | Day 2 |
| 7   | Set up Linear project. Import sprint backlog. Assign all Sprint 1 tickets. | Temi | Day 1 |
| 8   | Conduct Architecture Alignment Session with Foreign Engineer (2 hours). | Chidi | Day 2 |
| 9   | Distribute team onboarding doc + repo access to all engineers. | Temi | Day 1 |
| 10  | Configure Sentry project, Datadog agent, Snyk integration. | Fatima | Day 3 |
| 11  | Initial Figma design audit of existing screens. Produce delta list. | Kelechi | Day 2 |
| 12  | Write and share API contract template (request/response envelope standard). | Chidi | Day 3 |

## **8.3 Module Ownership Map**

**RULE** Each module has one owner who is accountable for its architecture, API design, and test coverage. Other engineers may contribute code but the owner reviews and merges all PRs for their module.

| **Module** | **Owner** | **Collaborator(s)** |
| --- | --- | --- |
| auth | Chidi Okonkwo | Emeka Adeyemi (implementation), Fatima Al-Hassan (security review) |
| users | Amara Nwosu | Emeka Adeyemi (API), Kelechi Eze (profile UI) |
| listings | Emeka Adeyemi | Amara Nwosu (frontend), Chidi Okonkwo (PostGIS queries) |
| search | Chidi Okonkwo | Emeka Adeyemi (OpenSearch), Amara Nwosu (UI) |
| agents | Emeka Adeyemi | Amara Nwosu (portal UI), Fatima Al-Hassan (KYC tests) |
| payments | Emeka Adeyemi | Chidi Okonkwo (architecture), Fatima Al-Hassan (security audit) |
| messaging | Emeka Adeyemi | Amara Nwosu (UI), Fatima Al-Hassan (Socket.io security) |
| directory | Amara Nwosu | Emeka Adeyemi (API), Kelechi Eze (design) |
| whatsapp | Chidi Okonkwo | Emeka Adeyemi (queue/bridge), Amara Nwosu (approval UI) |
| developers | Amara Nwosu | Emeka Adeyemi (API), Kelechi Eze (portal design) |
| seo | Chidi Okonkwo | Emeka Adeyemi (posting APIs), Amara Nwosu (content UI) |
| ai  | Chidi Okonkwo | Foreign Engineer (implementation ownership, reviewed by Chidi) |

**FOREIGN ENGINEER ASSIGNMENT** The Foreign Engineer is assigned primary implementation ownership of the ai module (FastAPI service, LangChain prompts, model integrations). All work reviewed by Chidi Okonkwo before merge. Architecture decisions escalated to Chidi. The Foreign Engineer also contributes to whatsapp module extraction logic.

## **8.4 Environment Variables — Complete List**

| **Variable** | **Service** | **Description** |
| --- | --- | --- |
| DATABASE_URL | API | PostgreSQL (Prisma format) — includes PostGIS extension |
| REDIS_URL | API | ElastiCache Redis endpoint |
| OPENSEARCH_URL | API | AWS OpenSearch endpoint |
| JWT_PRIVATE_KEY | API | RS256 private key (PEM). NEVER commit to git. |
| JWT_PUBLIC_KEY | API+Web | RS256 public key for verification |
| PAYSTACK_SECRET_KEY | API | sk_test_\* or sk_live_\* |
| PAYSTACK_WEBHOOK_SECRET | API | HMAC-SHA512 webhook signature key |
| FLUTTERWAVE_SECRET_KEY | API | Flutterwave fallback key |
| AWS_S3_BUCKET | API | Media uploads bucket name |
| AWS_CLOUDFRONT_DOMAIN | API | CDN domain for image URLs |
| AWS_REGION | API | AWS region (e.g. af-south-1 or eu-west-2) |
| MAPBOX_PUBLIC_TOKEN | Web | Public token for map rendering |
| SES_FROM_ADDRESS | API | Verified SES sender email |
| TERMII_API_KEY | API | Termii SMS gateway key |
| DOJAH_APP_ID | API | Dojah KYC verification app ID |
| DOJAH_SECRET_KEY | API | Dojah secret key |
| WHATSAPP_WEBHOOK_SECRET | API | Evolution API HMAC secret for webhook validation |
| EVOLUTION_API_URL | API | Self-hosted Evolution API base URL |
| EVOLUTION_API_KEY | API | Evolution API authentication key |
| ANTHROPIC_API_KEY | AI Svc | Claude 3.5 Sonnet API key |
| OPENAI_API_KEY | AI Svc | GPT-4o fallback key |
| GROK_API_KEY | AI Svc | Grok fallback key |
| FACEBOOK_PAGE_ACCESS_TOKEN | API | Long-lived Facebook Page token for posting |
| TWITTER_BEARER_TOKEN | API | Twitter API v2 bearer token |
| LINKEDIN_ACCESS_TOKEN | API | LinkedIn OAuth token for company page posting |
| SENTRY_DSN | All | Sentry project DSN |
| NEXT_PUBLIC_API_BASE_URL | Web | Backend API base URL (exposed to browser) |
| NEXT_PUBLIC_MAPBOX_TOKEN | Web | Mapbox token (same as above, Next.js public prefix) |

# **9\. Production Launch Gates**

**HARD GATE — PRODUCTION IS BLOCKED UNLESS ALL PASS** Every item below must be GREEN before Emeka Adeyemi runs the blue/green production deployment. No exceptions. No partial launches.

|     | **Gate** | **Owner** | **Status** |
| --- | --- | --- | --- |
| G1  | Snyk: zero Critical or High vulnerabilities in production build | Fatima | \[ \] PASS |
| G2  | k6 load test: p99 < 800ms at 500 concurrent users on /api/v1/listings/search | Fatima | \[ \] PASS |
| G3  | Lighthouse CI: LCP < 2.5s, FID < 100ms, CLS < 0.1 on homepage (3G) | Amara | \[ \] PASS |
| G4  | All 10 Playwright E2E journeys green on staging | Fatima | \[ \] PASS |
| G5  | OWASP ZAP: zero High findings. All Medium findings triaged. | Fatima | \[ \] PASS |
| G6  | Paystack live mode: end-to-end payment test (₦100 real charge + refund) | Emeka | \[ \] PASS |
| G7  | WhatsApp bridge: test message → extraction → approval → listing live (< 60s) | Chidi | \[ \] PASS |
| G8  | SEO engine: listing approved → 10 variants generated → appear in approval queue | Chidi | \[ \] PASS |
| G9  | Client UAT sign-off: all acceptance criteria verified and signed | Temi | \[ \] PASS |
| G10 | NDPA 2023 compliance checklist: privacy policy, cookie consent, data retention policy | Temi | \[ \] PASS |
| G11 | Sentry + Datadog: monitoring alerts live and tested (trigger test error) | Emeka | \[ \] PASS |
| G12 | All environment variables in AWS Secrets Manager (no .env files in ECS task def) | Emeka | \[ \] PASS |
| G13 | RDS automated backups verified: point-in-time recovery tested | Emeka | \[ \] PASS |
| G14 | WCAG 2.1 AA: axe-core zero critical violations on all 21 public pages | Kelechi | \[ \] PASS |
| G15 | Foreign Engineer code: 100% of commits reviewed + approved by Chidi Okonkwo | Chidi | \[ \] PASS |

STACKLANE TECHNOLOGIES LTD · LandShoppers Project Development Framework v1.1

Chidi Okonkwo, Software Architect · Temi Lawson, Project Manager · May 2026

_Building world-class software from Africa, for the world._