**ServiceHub**

_The Trusted Engine Room for Real Estate Transactions_

**LandShoppers Services Ecosystem — Complete Technical & Product Specification**

_From Land to Completion in One Ecosystem. Find, Hire, and Manage Every Real Estate Service — with AI Intelligence._

**STACKLANE TECHNOLOGIES LTD · LandShoppers v1.1 · Services Ecosystem — Full Specification v1.0**

|     |     |
| --- | --- |
| Document | ServiceHub — Complete Services Ecosystem Specification |
| Version | 1.0 — May 2026 |
| Scope | Ecosystem Architecture · Database · API · Provider OS (11 pages) · Marketplace (6 pages) · Business Model · AI Systems · Sprint Plan |
| Total Pages | 17 pages (6 marketplace + 11 Provider OS portal) |
| Service Categories | 12 categories · 47 sub-categories · Bundle packages |
| Tier Model | Free · Pro (₦15,000/mo) · Elite (₦35,000/mo) |
| Architect | Chidi Okonkwo — Stacklane Technologies Ltd |
| Innovation Themes | Contextual Matching · AI Lead Scoring · WhatsApp Bridge · Bundle Packages · Escrow |
| Classification | CLIENT CONFIDENTIAL |

**ECOSYSTEM VISION** ServiceHub is not a directory. A directory is passive — it lists businesses and waits for users to search. ServiceHub is an active matching engine embedded throughout the entire LandShoppers platform. When a buyer views a Lekki property, ServiceHub recommends a title lawyer 2km away. When an agent closes a deal, ServiceHub surfaces a photographer for the next listing. When a developer publishes a project, ServiceHub pre-fills a bundle of surveyors, architects, and contractors. Every transaction on LandShoppers feeds the ServiceHub flywheel.

# **1\. ServiceHub Ecosystem Architecture**

## **1.1 The Four Participant Types**

| **Participant** | **Role in ServiceHub** | **How They Find Providers** | **How They Become a Lead** |
| --- | --- | --- | --- |
| Buyer | Needs services to complete a property purchase | Contextual recommendations on listing detail page · Directory search | Clicks 'Request Quote' on recommended provider |
| Agent | Needs service partners to support their listings and clients | 'My Preferred Partners' panel in AgentOS · Directory | Refers client to a provider · agent earns referral credit |
| Developer | Needs bulk services for projects (surveys, architecture, legal) | Bulk service request from developer portal · Provider directory | Submits project-level service request (multi-provider) |
| Service Provider | Receives leads, manages jobs, builds reputation | Is found · matched · referred · WhatsApp-extracted | Responds to quote requests through Provider OS |

## **1.2 The ServiceHub Flywheel**

**FLYWHEEL LOGIC** More verified providers → better contextual matches → more lead requests → more completed jobs → more reviews → higher trust scores → more buyers/agents trust recommendations → more lead requests. Each revolution of this flywheel makes the platform more valuable to every participant. The key accelerant is the contextual match — a recommendation is 7× more likely to convert than a cold directory browse.

| **Step** | **Flywheel Stage** | **What Happens** |
| --- | --- | --- |
| 1   | Provider joins + verifies | Creates profile, uploads credentials, sets service areas, gets verified badge. |
| 2   | Contextual match fires | Buyer views a Lekki listing → ServiceHub surfaces this provider as 'Recommended Title Lawyer in Lekki'. |
| 3   | Quote request submitted | Buyer clicks 'Request Quote' → structured lead lands in provider's inbox with AI summary. |
| 4   | Provider responds fast | AI auto-reply + human follow-up. Fast response = higher match score next cycle. |
| 5   | Job completed | Agent or buyer marks job as complete → 'Job Verified' badge awarded to provider. |
| 6   | Review generated | Post-completion: automated review request sent. Review → boosts match ranking. |
| 7   | Score increases | Provider's contextual match score rises → shown to more buyers → more leads. Cycle repeats. |

## **1.3 Integration Touchpoints Across LandShoppers**

| **Platform Location** | **Integration Type** | **What ServiceHub Does There** |
| --- | --- | --- |
| Listing Detail Page (PUB-03) | Contextual Recommendation Block | After inquiry form: 'Recommended Services for This Property' — 3–5 matched providers in same LGA. AI-ranked. |
| Property Search Results (PUB-02) | Sidebar Widget | 'Need help buying?' widget: quick links to nearest lawyer + surveyor based on search location. |
| Agent Dashboard (AGT-01) | Preferred Partners Panel | Agent's pinned service providers. Referral earnings tracker. 'Recommend to Client' one-tap action. |
| Developer Portal (DEV-03 Create Project) | Bundle Request Flow | 'Add Services to Project' step: select service types → ServiceHub matches providers → developer sends bulk RFQ. |
| Post-Purchase Email | Triggered Email | 3 days after deal marked closed: 'Complete your purchase — connect with verified service providers.' |
| WhatsApp Broadcast (SEO Engine) | Cross-sell Message | Property posts include a line: 'Need a surveyor or lawyer? Reply SERVICES for recommendations.' |
| Buyer Dashboard (BUY-01) | My Services Widget | All buyer's active service requests: status, provider, next action. |
| Admin Panel (ADM-01) | ServiceHub KPIs | Leads generated, jobs completed, GMV of service transactions, provider verification queue. |

## **1.4 The 12 Service Categories & 47 Sub-Categories**

| **#** | **Category** | **Icon Tag** | **Sub-Categories (47 total)** |
| --- | --- | --- | --- |
| 1   | Legal & Title | ⚖️  | Title perfection · Deed of assignment · Statutory right of occupancy · Governor's consent · Probate · Contract review · Dispute resolution |
| 2   | Survey & Mapping | 📐  | Land survey · Topographic survey · Building survey · Boundary demarcation · GIS mapping · Survey plan preparation |
| 3   | Valuation & Appraisal | 💰  | Property valuation · Plant & machinery · Business valuation · Insurance valuation · Mortgage valuation · Portfolio valuation |
| 4   | Architecture & Design | 🏛️ | Architectural design · Interior design · Structural engineering · MEP engineering · Quantity surveying · Space planning |
| 5   | Photography & Media | 📸  | Property photography · Drone aerial · Videography · Virtual tour · 3D render · Floor plan drawing · Virtual staging |
| 6   | Mortgage & Finance | 🏦  | Mortgage origination · Mortgage advisory · Refinancing · NHF processing · Infrastructure bond · Investment advisory |
| 7   | Construction & Renovation | 🔨  | General contractor · Building materials · Roofing · Plumbing · Electrical · Tiling · Painting · Landscaping |
| 8   | Property Management | 🏢  | Facility management · Tenant screening · Rent collection · Maintenance management · Concierge services |
| 9   | Insurance | 🛡️ | Homeowner's insurance · Fire & special perils · Landlord insurance · Mortgage protection · Title insurance |
| 10  | Cleaning & Moving | 🚛  | Pre-purchase inspection cleaning · Move-in cleaning · Moving & packing · Storage · Fumigation · Waste disposal |
| 11  | Home Technology | 💡  | Smart home installation · CCTV & security systems · Solar & backup power · Internet infrastructure · Home automation |
| 12  | Inspection & Certification | 🔍  | Pre-purchase inspection · Building compliance · Fire safety · Environmental assessment · Soil test · Structural integrity |

## **1.5 Service Bundle Packages**

**BUNDLE INNOVATION** Bundles create a single-click solution for complex needs. A buyer closing a ₦50M property in Lagos needs at minimum: a lawyer, a surveyor, a valuer, and potentially a mortgage advisor. ServiceHub bundles these into named packages with pre-vetted provider slots. One request. Multiple matched providers. The platform earns a co-ordination fee on bundle activations.

| **Bundle Name** | **Services Included** | **Est. Cost Range** | **Trigger** |
| --- | --- | --- | --- |
| Lagos Title Perfection Package | Legal (title) + Survey + Valuation + Governor's Consent filing | ₦350,000–₦800,000 | Buyer clicks 'Complete Purchase' on listing |
| New Home Ready Package | Inspection + Cleaning + Smart Home basic install + CCTV | ₦180,000–₦450,000 | Within 7 days of deal marked closed |
| Off-Plan Investor Package | Legal review + Mortgage advisory + NHF processing + Insurance | ₦250,000–₦600,000 | Shown on off-plan/developer project pages |
| Listing Launch Package | Property photography + Virtual tour + Floor plan + Drone | ₦120,000–₦280,000 | Agent creates new listing — offered in AGT-03 Step 3 |
| Developer Project Package | Architecture + Quantity survey + Legal (company) + Insurance | ₦2M–₦15M | Developer creates new project in DEV-03 |
| Diaspora Remote Purchase Package | Legal + Survey + Valuation + Property management setup | ₦500,000–₦1.2M | Shown to users with UK/US/CA IP address or profile flag |

# **2\. ServiceHub Database Schema — 9 New Tables**

## **2.1 Schema Rules (Inherits from LandShoppers Core)**

- All PKs UUID. All money in kobo (BIGINT). All timestamps TIMESTAMPTZ. Soft deletes via deletedAt.
- geom columns (GEOGRAPHY POINT) on service_providers and service_locations tables — mandatory GIST index.
- service_providers.slug UNIQUE — used for SEO-friendly URLs (/services/legal/adeyemi-law-firm).
- ai_match_score is a computed column, refreshed by the match-scoring BullMQ job every 6 hours per provider.

## **2.2 Table Definitions**

### **Table 1 — service_providers**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id  | UUID PK | @default(uuid()) |
| userId | UUID FK→users | One user account per provider. UNIQUE constraint. |
| businessName | VARCHAR(150) | Displayed on all public pages. |
| slug | VARCHAR(200) UNIQUE | Generated from businessName. Used in SEO URLs. |
| category | ENUM ServiceCategory | Primary category (1 of 12). |
| subCategories | VARCHAR\[\] | Array of sub-category codes (e.g. \['title_perfection','deed_assignment'\]). |
| description | TEXT | Full service description. Max 2000 chars. |
| servicesOffered | JSONB\[\] | Array of service objects: {name, description, priceFrom, priceTo, unit, deliveryDays}. |
| serviceAreas | VARCHAR\[\] | Array of LGA/area strings e.g. \['Lekki Phase 1','Ikeja','VI'\]. |
| city | VARCHAR(100) | Primary operating city. |
| state | VARCHAR(100) | Primary operating state. |
| geom | GEOGRAPHY(POINT) | Business location. GIST indexed. |
| phone | VARCHAR(20) | Primary contact. |
| whatsappPhone | VARCHAR(20) nullable | WhatsApp number if different from phone. |
| email | VARCHAR(255) | Business email. |
| website | VARCHAR(500) nullable | Optional. |
| verificationLevel | ENUM VerifLevel | basic \| standard \| professional \| elite. Affects match ranking. |
| isVerified | BOOL DEFAULT false | Set to true when standard+ verification complete. |
| kycDocuments | JSONB nullable | Stored references to S3 keys for uploaded creds. |
| licenseNumber | VARCHAR nullable | Professional license / COREN / NBA / NIESV etc. |
| licenseBody | VARCHAR nullable | Issuing professional body. |
| rating | DECIMAL(3,2) DEFAULT 0 | Average of all completed job reviews. Recomputed on new review. |
| reviewCount | INT DEFAULT 0 | Total verified reviews. |
| viewCount | INT DEFAULT 0 | Profile page views. Incremented via Redis + async sync. |
| leadCount | INT DEFAULT 0 | Total quote requests ever received. |
| completedJobCount | INT DEFAULT 0 | Jobs marked complete by clients. Core trust signal. |
| responseRatePercent | INT DEFAULT 0 | % of leads responded to within 24h. Recomputed weekly. |
| avgResponseHours | DECIMAL nullable | Average hours to first response. Used in match scoring. |
| aiMatchScore | DECIMAL(5,2) DEFAULT 0 | Composite score used by contextual match engine. Updated every 6h. |
| isFeatured | BOOL DEFAULT false | Premium placement in directory + recommendations. |
| featuredUntil | TIMESTAMPTZ nullable | Expiry of featured placement. |
| subscriptionTier | ENUM ProviderTier DEFAULT free | free \| pro \| elite. |
| whatsappConnected | BOOL DEFAULT false | Evolution API bridge active. |
| portfolioItems | JSONB\[\] | Array of {title, description, imageS3Key, completedAt, propertyType, location}. |
| teamSize | INT nullable | Number of staff. Displayed on profile. |
| foundedYear | INT nullable | Year business founded. |
| deletedAt | TIMESTAMPTZ nullable | Soft delete. |
| createdAt | TIMESTAMPTZ | Auto. |
| updatedAt | TIMESTAMPTZ | Auto. |

### **Table 2 — service_leads**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id  | UUID PK |     |
| serviceProviderId | UUID FK→service_providers | The provider receiving the lead. |
| clientUserId | UUID FK→users nullable | If logged-in user. Null for guest requests. |
| clientName | VARCHAR | From form or user profile. |
| clientPhone | VARCHAR | Required for lead to be valid. |
| clientEmail | VARCHAR nullable |     |
| source | ENUM LeadSource | listing_page \| directory \| bundle \| whatsapp \| agent_referral \| developer_rfq \| post_purchase |
| listingId | UUID FK→listings nullable | If lead came from a listing page contextual match. |
| projectId | UUID FK→developer_projects nullable | If lead came from developer project. |
| bundleId | UUID FK→service_bundles nullable | If lead is part of a bundle activation. |
| serviceRequested | VARCHAR | Which specific service the client needs. |
| message | TEXT | Client's description of their need. |
| budget | BIGINT nullable | Client's stated budget in kobo. |
| timeline | VARCHAR nullable | 'ASAP' \| 'Within 1 week' \| '1–4 weeks' \| 'Flexible'. |
| location | VARCHAR | Where the service is needed. |
| status | ENUM ServiceLeadStatus | pending \| responded \| quoted \| negotiating \| accepted \| completed \| cancelled \| lost |
| aiScore | DECIMAL(5,2) nullable | Lead quality score 0–100. Hot≥70, Warm 40–69, Cold<40. |
| aiSummary | TEXT nullable | AI-generated summary of the client's need. |
| quotedAmountKobo | BIGINT nullable | Provider's quoted price. |
| finalAmountKobo | BIGINT nullable | Agreed final price. |
| respondedAt | TIMESTAMPTZ nullable | When provider first replied. |
| completedAt | TIMESTAMPTZ nullable | When job marked complete. |
| createdAt | TIMESTAMPTZ |     |

### **Table 3 — service_bundles**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id  | UUID PK |     |
| name | VARCHAR | 'Lagos Title Perfection Package' etc. |
| slug | VARCHAR UNIQUE | URL slug. |
| description | TEXT | What the bundle covers. |
| categories | ServiceCategory\[\] | Which service categories are included. |
| priceFromKobo | BIGINT | Lower estimate of total bundle cost. |
| priceToKobo | BIGINT | Upper estimate. |
| triggerContext | ENUM BundleTrigger | post_purchase \| listing_create \| developer_project \| diaspora \| off_plan |
| isActive | BOOL DEFAULT true |     |
| activationCount | INT DEFAULT 0 | How many times this bundle has been activated. |

### **Table 4 — bundle_activations**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id  | UUID PK |     |
| bundleId | UUID FK→service_bundles |     |
| clientUserId | UUID FK→users |     |
| listingId | UUID FK nullable | Source listing if applicable. |
| status | ENUM | initiated \| providers_matched \| in_progress \| completed \| cancelled |
| matchedProviders | JSONB | Array of {serviceCategory, providerId, status, leadId}. |
| totalAmountKobo | BIGINT nullable | Sum of all provider quotes. |
| platformFeeKobo | BIGINT nullable | 5% co-ordination fee on bundle GMV. |
| createdAt | TIMESTAMPTZ |     |

### **Table 5 — service_reviews**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id  | UUID PK |     |
| serviceLeadId | UUID FK→service_leads | Review linked to specific completed job. |
| serviceProviderId | UUID FK→service_providers |     |
| reviewerId | UUID FK→users | The client who left the review. |
| overallRating | INT (1–5) | Overall star rating. |
| qualityRating | INT (1–5) | Quality of work. |
| communicationRating | INT (1–5) | Communication rating. |
| timelinessRating | INT (1–5) | On-time delivery rating. |
| valueRating | INT (1–5) | Value for money. |
| title | VARCHAR(100) | Review headline. |
| body | TEXT | Full review text. |
| isJobVerified | BOOL DEFAULT false | True if job completion was confirmed by both parties. |
| providerResponse | TEXT nullable | Provider's public reply to review. |
| createdAt | TIMESTAMPTZ |     |

### **Table 6 — provider_whatsapp_connections**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id  | UUID PK |     |
| serviceProviderId | UUID FK→service_providers |     |
| phoneNumber | VARCHAR | Connected WhatsApp number (masked in UI). |
| evolutionInstanceName | VARCHAR | Evolution API instance identifier. |
| status | ENUM | connected \| disconnected \| error |
| monitoredGroups | JSONB\[\] | Array of {groupId, groupName, isActive, messageCount}. |
| extractedLeadsCount | INT DEFAULT 0 | Lifetime leads extracted from this connection. |
| connectedAt | TIMESTAMPTZ |     |
| lastActiveAt | TIMESTAMPTZ |     |

### **Table 7 — provider_availability**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id  | UUID PK |     |
| serviceProviderId | UUID FK→service_providers |     |
| date | DATE | Specific date entry. |
| isAvailable | BOOL | False = blocked/busy. |
| slots | JSONB nullable | Array of {startTime, endTime, isBooked} if time-slot based. |
| note | VARCHAR nullable | E.g. 'Out of Lagos this week'. |

### **Table 8 — provider_ai_match_log**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id  | UUID PK |     |
| serviceProviderId | UUID FK |     |
| listingId | UUID FK nullable | The listing context for which this match was computed. |
| matchScore | DECIMAL(5,2) | 0–100 contextual match score for this provider + this listing. |
| scoreFactors | JSONB | Breakdown: {proximity:20, category:25, rating:20, responseRate:15, verification:20}. |
| position | INT | Rank position shown (1=first recommendation). |
| wasClicked | BOOL DEFAULT false | Did buyer click this recommendation? |
| convertedToLead | BOOL DEFAULT false | Did click become a quote request? |
| createdAt | TIMESTAMPTZ |     |

### **Table 9 — agent_preferred_partners**

| **Column** | **Type** | **Notes** |
| --- | --- | --- |
| id  | UUID PK |     |
| agentId | UUID FK→agents | The agent who pinned this provider. |
| serviceProviderId | UUID FK→service_providers |     |
| referralCount | INT DEFAULT 0 | How many client referrals this agent has sent to this provider. |
| earnedCreditsKobo | BIGINT DEFAULT 0 | Referral credits earned from this provider relationship. |
| createdAt | TIMESTAMPTZ |     |

# **3\. ServiceHub API Reference**

## **3.1 Public Marketplace Endpoints**

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| GET | /api/v1/services | List/search providers. Params: category, state, lga, verified, rating_min, keyword, lat, lng, radius_km, sort, page, limit. |
| GET | /api/v1/services/:slug | Full provider profile. Includes services, reviews, portfolio, availability snippet. |
| POST | /api/v1/services/:slug/quote | Submit quote request (service_lead). Auth optional — guest allowed with name+phone. |
| GET | /api/v1/services/match | Contextual match for a listing. Params: listingId, categories\[\] (optional). Returns top 5 per category. |
| GET | /api/v1/services/categories | All 12 categories with sub-categories and provider counts. |
| GET | /api/v1/services/bundles | All active bundle packages with included services and price ranges. |
| POST | /api/v1/services/bundles/:id/activate | Activate a bundle. Creates multiple service_leads, triggers match engine. |
| GET | /api/v1/services/:slug/reviews | Paginated reviews for a provider. Filter: rating, verified_only. |
| GET | /api/v1/services/:slug/availability | Provider's availability calendar (next 30 days). |

## **3.2 Provider Portal Endpoints (Auth Required: provider role)**

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| GET | /api/v1/provider/dashboard | Aggregated home page payload. Redis-cached 60s. |
| GET | /api/v1/provider/context | Lightweight shell payload: name, avatar, tier, verification status. |
| GET | /api/v1/provider/leads | All leads. Filter: status, source, score_min, date_from, date_to. Paginated. |
| PATCH | /api/v1/provider/leads/:id | Update lead status, add quote amount, add response note. |
| POST | /api/v1/provider/leads/:id/respond | First response to a lead. Records respondedAt. Updates response rate. |
| POST | /api/v1/provider/leads/:id/quote | Submit formal quote: amount, timeline, description. |
| PATCH | /api/v1/provider/profile | Update profile: description, services, areas, phone, social links. |
| POST | /api/v1/provider/portfolio | Add portfolio item with image upload (S3). |
| DELETE | /api/v1/provider/portfolio/:id | Remove portfolio item. |
| GET | /api/v1/provider/analytics | Time-range analytics: leads, revenue, response rate, category breakdown. |
| GET | /api/v1/provider/analytics/match-performance | How often shown in recommendations vs converted. |
| GET | /api/v1/provider/subscription | Current plan + usage + invoices. |
| POST | /api/v1/provider/subscription/upgrade | Initiate Paystack subscription upgrade. |
| GET | /api/v1/provider/availability | Get provider's availability calendar. |
| POST | /api/v1/provider/availability | Set availability: block dates, set slots. |
| POST | /api/v1/provider/kyc/submit | Submit KYC documents for verification. |
| GET | /api/v1/provider/kyc/status | Current verification level and pending items. |
| POST | /api/v1/provider/whatsapp/connect | Initiate Evolution API QR code connection. |
| GET | /api/v1/provider/whatsapp/status | Bridge connection status + groups. |
| POST | /api/v1/provider/whatsapp/groups/:id/toggle | Enable/disable monitoring for a specific group. |
| GET | /api/v1/provider/reviews | All reviews received. Filter: rating, verified_jobs. |
| POST | /api/v1/provider/reviews/:id/respond | Post public response to a review. |

## **3.3 Contextual Match Engine — Design**

**MATCH ALGORITHM** The contextual match engine is the technical centrepiece of ServiceHub. It runs on every listing detail page load and returns the top 5 providers per requested service category. The algorithm weights five factors: proximity (20%), category exactness (25%), composite trust score (20%), response rate (15%), and verification level (20%). Results are cached per listing+category pair for 30 minutes in Redis.

| **Factor** | **Weight** | **Calculation** |
| --- | --- | --- |
| Proximity | 20% | PostGIS ST_Distance(provider.geom, listing.geom). Max score at 0–2km. Linear decay to 0 at 50km. |
| Category Match | 25% | Exact sub-category match = 25. Primary category match = 15. Adjacent category = 5. |
| Trust Score | 20% | Composite: (rating/5 × 40) + (completedJobCount/100 × 30, max 100 jobs) + (reviewCount/50 × 30, max 50 reviews). |
| Response Rate | 15% | responseRatePercent × 0.15. Provider with 100% rate gets full 15 points. |
| Verification Level | 20% | elite=20 · professional=16 · standard=10 · basic=4 · unverified=0. |

## **3.4 Admin Endpoints (admin/super_admin role)**

| **Method** | **Endpoint** | **Description** |
| --- | --- | --- |
| GET | /api/v1/admin/services/providers | All providers. Filter by tier, verification, category, city. |
| PATCH | /api/v1/admin/services/providers/:id/verify | Update verification level. Triggers badge + match score recalculation. |
| GET | /api/v1/admin/services/kyc-queue | All pending KYC submissions with document links. |
| GET | /api/v1/admin/services/leads | All service leads platform-wide. Filter by source, status, category. |
| GET | /api/v1/admin/services/bundles | Manage bundle packages: create, edit, activate, deactivate. |
| GET | /api/v1/admin/services/analytics | Platform-level ServiceHub metrics: GMV, leads, conversion, top categories. |

# **4\. Public Marketplace — 6 Pages**

_All 6 public marketplace pages are SSR-rendered for SEO. URLs are structured for high search intent: /services/legal/lagos, /services/photographers/lekki etc._

**SVC-PUB-01 Services Homepage**

**Route:** /services **Tier:** Public — All Users

_The entry point to ServiceHub. Surfaces the 12 categories visually, showcases featured providers, and drives contextual entry via search. Designed to feel like a trusted local professional network, not a classified ad board._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Search Bar | Compound Input | Two fields: 'What service do you need?' (text/autocomplete from categories+sub-categories) + 'Where?' (location autocomplete via Mapbox). Large CTA button: 'Find Providers'. |
| Category Grid | Icon Grid | 12 category cards in a 4×3 grid. Each: category icon (coloured), name, provider count in that category. Hover: slight lift + teal ring. Click → filtered directory. |
| Featured Providers Carousel | Horizontal Scroll | 5–8 verified featured providers (isFeatured=true). Card: photo, name, category badge, rating, city, 'View Profile' CTA. Auto-scrolls every 5s. |
| Popular Bundles Strip | 3-Card Row | 3 most activated bundles. Bundle name, included services chips, price range, 'Get Started' CTA → bundle activation flow. |
| How It Works | 3-Step Row | Step 1: Describe your need (icon: clipboard). Step 2: Get matched to verified providers (icon: shield). Step 3: Hire and track your job (icon: check). Clean, icon-driven. |
| Recently Verified Providers | 4-Card Grid | Latest providers to receive professional/elite verification. Social proof that the platform actively vets people. |
| Trust Statistics | Stat Row | Platform-wide numbers: '2,400+ verified providers' · '18,000+ jobs completed' · '4.8 average rating' · '12 service categories'. Updated from DB aggregates. |
| City Filters | Pill Row | Quick-filter by city: Lagos · Abuja · Port Harcourt · Ibadan · Kano · Enugu. Filters the featured providers and category counts. |

**SVC-PUB-02 Provider Directory**

**Route:** /services/\[category\] · /services/\[category\]/\[state\] **Tier:** Public

_The searchable, filterable list of all verified providers. URL structure is SEO-optimised for high-intent queries like 'property lawyers in Lagos' or 'surveyors in Abuja'. Every filter permutation has a unique crawlable URL._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Breadcrumb | Navigation | Services > Legal & Title > Lagos. Schema.org BreadcrumbList markup. |
| Page Title (H1 — SEO) | Dynamic H1 | 'Property Lawyers in Lagos (47 verified providers)'. Dynamically generated from category + location filters for SEO. |
| Filter Sidebar (Desktop) | Left Panel | Sub-category checkboxes · Minimum rating stars (1–5 slider) · Verification level (Basic/Standard/Professional/Elite) · Service area LGA multi-select · Team size range · Available only toggle. |
| Sort Control | Dropdown | Recommended (AI match score) · Highest Rated · Most Jobs Completed · Newest · Fastest Response Time. |
| Provider Card (Grid) | Card | Business name + avatar · Category badge · Sub-category chips (max 3 shown) · Rating stars + count · City + LGA · Key stat: 'X jobs completed' · Verification badge · 'Request Quote' CTA + 'View Profile' secondary. |
| Map View Toggle | Toggle Button | Switches to Mapbox map showing provider locations as pins. Click pin → mini profile popup with 'Request Quote'. |
| Active Filters Row | Pill Row | Shows active filters as dismissible pills. 'Clear All Filters' link. |
| Empty State | Illustration | If no providers match: 'No providers found in this area. Be the first! →' with sign-up CTA for providers. |
| SEO Footer Block | Text Block | Area-specific paragraph for SEO: 'Find verified property lawyers in Lagos, Nigeria. All lawyers on LandShoppers are KYC-verified...' Unique per category+location. |

**SVC-PUB-03 Provider Profile Page**

**Route:** /services/\[category\]/\[slug\] **Tier:** Public

_The provider's public shop window. The most important conversion page in ServiceHub — this is where trust is built and quote requests are submitted. Designed to give the provider every opportunity to showcase expertise while giving buyers every signal they need to commit._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Profile Hero | Top Banner | Business logo (avatar) · Business name · Tagline · Verification badge (with tooltip explaining what it means) · Rating stars + review count · 'X jobs completed' badge · City · Response time stat: 'Usually replies within 2 hours'. |
| Quick Action Bar | Sticky Bar | Sticky at top when scrolling: Business name (small) · 'Request Quote' (orange CTA) · 'Message' (outline) · 'Save' (heart icon). |
| About Section | Text Block | Full business description. AI-generated or manually written. 'Read more' toggle if >300 chars. |
| Services Offered | Accordion List | Each service: name · description · price range · delivery timeframe · 'Request This Service' CTA. Expandable. |
| Service Areas | Visual List | LGAs and cities served. Map pin icons. If PostGIS data: small embedded map showing coverage radius. |
| Portfolio Gallery | Masonry Grid | Portfolio items: photo + title + category + location. Lightbox on click. 'Before/After' toggle if provider uploaded both. |
| Availability Calendar | Mini Calendar | Next 30 days. Green = available, grey = unavailable, amber = limited. 'Check availability for \[date\]' → sends enquiry with date. |
| Reviews Section | Review List | Paginated. Each: reviewer avatar (initials) · star rating (overall + sub-ratings: quality/communication/timeliness/value) · review body · 'Job Verified' badge if applicable · provider response (if any) · date. |
| Team Section | Avatar Row | Team members with names and titles if provider has added them. |
| Professional Credentials | Badge Row | License number · issuing body · year licensed. Verification status badge per credential. |
| FAQ Accordion | Q&A Section | Provider's answers to common questions. AI-suggested questions based on category; provider fills in answers. |
| Similar Providers | Card Row | 3 similar providers in same category and city. Prevents dead ends if this provider isn't right. |
| Quote Request Form (Sidebar) | Sticky Form | On desktop: sticky right sidebar form. Name · Phone · Email · Service needed (dropdown from their services) · Message · Timeline · Budget (optional). Submit → creates service_lead. |

**SVC-PUB-04 Bundle Packages Page**

**Route:** /services/bundles **Tier:** Public

_Converts complex multi-service needs into a single decision. Buyers who don't know what services they need discover the right bundle here. Each bundle is a pre-packaged solution, not a generic list._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Bundle Hero | Header | Headline: 'Complete real estate service packages — everything you need, in one place.' Sub-text explaining the co-ordination value. |
| Bundle Cards | Card Grid | Each bundle: name · included service icons · price range chip · 'X activations this month' social proof · description · 'Get Started' CTA → activation flow. |
| Bundle Detail Modal | Modal/Drawer | On 'Get Started': slide-in detail: full service list · what's included · typical timeline · how matching works · 'Activate This Bundle' → leads to Step 1 of activation flow. |
| Bundle Activation Flow | 3-Step Wizard | Step 1: Confirm your location and property details. Step 2: Review matched providers for each service (AI pre-selects top match, buyer can swap). Step 3: Submit all quote requests in one click. |
| Custom Bundle Builder | Interactive Tool | 'Build Your Own Bundle' link. Buyer selects 2–6 categories → system matches providers for each → one-step multi-quote submission. |

**SVC-PUB-05 Contextual Match Block (Embedded Component)**

**Route:** Embedded in PUB-03 Listing Detail **Tier:** Public

_This is NOT a standalone page — it is an embedded component that appears on every property listing detail page. It is the highest-converting entry point into ServiceHub because the buyer is already in purchase intent mode._

**CONVERSION INSIGHT** A buyer who has just submitted a property inquiry has the highest purchase intent of any user on the platform. At that moment, showing 'You will also need: a Title Lawyer and a Surveyor for this property' converts at 12–18% vs 2–3% for directory browse. This component must appear directly below the inquiry form confirmation on PUB-03.

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Section Header | Heading | 'Recommended Services for This Property' with subtitle: 'Verified professionals near \[property LGA\] who can help complete this purchase.' |
| Category Tabs | Tab Row | Legal · Survey · Valuation · Photography · Mortgage. First 2–3 pre-selected based on property type and transaction stage. |
| Provider Cards (3 per category) | Mini Cards | Compact: avatar · name · rating · response time · 'Request Quote' button. No price shown (drives to profile). |
| 'View All \[Category\] Providers' | Link | Each tab has a link to full directory filtered to that category + listing LGA. |
| Bundle Upsell | Callout Box | Below tabs: 'Need multiple services? The \[Bundle Name\] package bundles Legal + Survey + Valuation starting from ₦350,000. One click → multiple providers matched.' |
| Match Explanation | Tooltip | '?' icon on each provider: hover shows why they were matched: 'Verified · 0.8km away · 4.9 stars · 43 jobs in Lekki'. |

**SVC-PUB-06 Provider Onboarding / Registration**

**Route:** /services/join **Tier:** Public — Service Providers

_The acquisition funnel for new service providers. Must communicate the value proposition clearly, reduce friction, and set expectations about the verification process. Goal: provider completes profile and submits KYC within 10 minutes._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Value Proposition Hero | Header Section | Headline: 'Grow your real estate service business on Nigeria's largest property platform.' 3 key benefits: Get matched to buyers · Get verified · Get paid. Stats: '18,000+ jobs completed · ₦2.4B in service transactions'. |
| Plan Comparison | Pricing Table | Free vs Pro (₦15k) vs Elite (₦35k) with key features. 'Start Free' primary CTA. 'Try Pro Free for 30 Days' secondary. |
| Registration Form | Step Wizard | Step 1: Business basics (name, category, city). Step 2: Contact + password. Step 3: Services offered + areas. Step 4: First portfolio item (optional but encouraged). |
| Social Proof Testimonials | Quote Cards | 3 testimonials from existing verified providers: name, category, city, quote about leads received. |
| How Verification Works | Process Steps | Explains the 4 verification levels and what each unlocks. Reduces KYC anxiety. |
| FAQ Accordion | Q&A | Common questions: 'Is it free to join?' · 'How does matching work?' · 'How do I get paid?' · 'What documents do I need to verify?' |

# **5\. Provider OS Portal — 11 Pages**

_Route prefix: /provider/\[page\]. Protected by provider role. PortalShell mirrors AgentOS structure — dynamic identity, verification badge, tier badge. Same Turborepo component reuse strategy._

**PRV-01 Provider Command Center**

**Route:** /provider **Tier:** All Tiers (AI features tier-gated)

_The daily home for every service provider. Built to answer the one question every provider has when they open the app: 'Who needs me today and what should I do first?' Every element leads to revenue action._

### **Zone 1 — Identity Hero**

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Business Logo + Name | Header | Large logo/avatar. Business name + category badge. Tagline if set. |
| Verification Badge | Badge | Same pattern as AgentOS: colour ring on avatar (gold=professional+, amber=standard, grey=basic/unverified). |
| Rating + Jobs Stat | Stat Row | Star rating (1dp) · Review count · Completed jobs counter · Response rate %. |
| This Month Earnings | Stat | Pro/Elite only. ₦ formatted. Sub: 'from X completed jobs'. Upgrade nudge for Free. |
| Match Score Display | Score Widget | 'Your match score: 78/100'. Tooltip: 'Higher score = shown to more buyers. Improve by: responding faster, adding more portfolio items, completing verification.' |

### **Zone 2 — KPI Strip (5 Cards)**

| **Card** | **Metric** | **Tier** | **Innovation Detail** |
| --- | --- | --- | --- |
| KPI-1 | New Leads Today | All | Pulse animation if ≥3 new. Click → PRV-02 Lead Inbox. |
| KPI-2 | Hot Leads (AI ≥70) | Pro/Elite | Amber badge. AI-scored. Upgrade nudge on Free. |
| KPI-3 | Jobs In Progress | All | Active jobs awaiting completion. Click → PRV-04 Jobs. |
| KPI-4 | Profile Views This Week | All | Vs prior week arrow. Trend indicator. |
| KPI-5 | Match Appearances | Pro/Elite | How many times shown in contextual recommendations this week. |

### **Zone 3 — AI Insights Feed (Pro/Elite)**

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Slow Response Alert | AI Card | 'You have 3 unanswered leads older than 6 hours. Your response rate is dropping — this affects your match score.' CTA: 'Respond Now'. |
| Quote Win Insight | AI Card | 'Your quotes for Photography jobs have a 72% acceptance rate — highest in your category in Lagos. Your pricing is competitive.' |
| Match Opportunity | AI Card | 'There are 8 new property listings in Lekki this week and no featured surveyor in that LGA. Boost your profile to capture these leads.' |
| Portfolio Gap Alert | AI Card | 'Providers with 5+ portfolio items get 3× more lead conversions. You have 2. Add 3 more to unlock the portfolio boost.' |
| Review Request Nudge | AI Card | 'You completed 3 jobs this month but have 0 new reviews. Send review requests to your recent clients.' CTA: 'Send Review Requests'. |

### **Zone 4 — Main Content**

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Quick Actions Bar | Button Row | \+ Add Portfolio Item · Request Review · Boost Profile · Update Availability · Generate Quote Template. |
| Recent Leads Feed | Card List | Last 5 leads. Buyer name (masked: 'Buyer from Lekki') · service needed · source · AI score badge · time ago · 'Respond' CTA. |
| Jobs In Progress | Table | Active jobs: client name · service · start date · status (In Progress/Awaiting Payment/Pending Review) · Quick 'Mark Complete' button. |
| Upcoming Availability | Calendar Strip | Next 7 days mini calendar. Click blocked day to unblock. Click available day to block. Quick toggle. |
| Match Score Breakdown | Score Card | Detailed score: Proximity weight · Category match · Trust score · Response rate · Verification. 'How to improve each score factor' → links to relevant settings. |

**PRV-02 Lead Inbox — AI-Scored**

**Route:** /provider/leads **Tier:** All Tiers (AI scoring Pro/Elite)

_The provider's deal pipeline. Every incoming quote request, contextual match lead, bundle activation, and WhatsApp-extracted service inquiry lands here. AI-scored and prioritised so providers respond to the best leads first._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Inbox Tabs | Tab Bar | All · New (unread) · Hot (AI≥70) · Quoted · Negotiating · Won · Lost · Archived. Count badges. |
| Lead Card | List Item | Source icon (listing/directory/bundle/WhatsApp) · Buyer name (partial masked for privacy) · Service requested · Property location · Budget if stated · AI Score badge · Time ago · Unread dot. |
| Lead Detail Panel | Right Panel | Full lead: buyer details · property info · message · budget · timeline · source context ('From listing: 4-bed house Lekki Phase 1'). AI Summary at top: 'Buyer needs title perfection for a Lekki property. Budget ₦350k. Needs completion in 3 weeks. HIGH INTENT.' |
| AI Score Widget | Score Display | Pro/Elite: 0–100 score with 3 reasoning bullets. 'High intent because: budget stated · urgent timeline · property transaction in progress.' |
| Quick Actions | Button Row | Respond · Submit Quote · Schedule Call · WhatsApp Directly · Mark Won · Mark Lost. |
| Quote Builder | Inline Tool | 'Submit Quote' opens inline form: service breakdown (add line items) · subtotal · VAT toggle · total · delivery timeline · validity period. 'Preview Quote' generates PDF preview. |
| AI Reply Templates | Pill Suggestions | Pro/Elite: 3 AI-suggested opening responses based on the lead content. One-click to populate composer. |
| Response Composer | Text Area | Rich text. Attach files (portfolio samples, credentials PDF). Send → creates message thread + marks lead as 'responded'. |
| Source Context Card | Pinned Info | If from listing: property card pinned. If from bundle: bundle name + other categories in this bundle shown. |

**PRV-03 My Services & Profile Editor**

**Route:** /provider/profile **Tier:** All Tiers

_The provider's professional identity on LandShoppers. Live dual-panel editor — left form, right public preview updating in real-time. A strong profile directly increases the AI match score and lead conversion rate._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Profile Strength Meter | Progress Bar | 0–100%. Factors: photo (+10), description (+10), 3+ services (+15), service areas set (+10), 5+ portfolio items (+20), verified (+20), 2+ reviews (+15). Higher score = higher match ranking. |
| Business Details Form | Form Group | Business name · tagline · description (AI generate button Pro/Elite) · category (primary) · sub-categories (multi-select) · team size · founded year. |
| Services Offered Builder | Dynamic List | Add service: name · description · price from · price to · unit (per job/per sqm/per day/hourly) · delivery days. Drag to reorder. Delete. Min 1, max 20. |
| Service Areas | Tag Input + Map | Type LGA/area names → add as tags. OR draw on Mapbox map to set coverage polygon (Pro/Elite). Map shows all tagged areas as highlighted zones. |
| Contact & Availability Hours | Form Group | Phone · WhatsApp · Email · Website · Working hours (Mon–Sun time range per day). 'Closed' toggle per day. |
| Portfolio Manager | Drag Grid | Upload images + add title, description, category, location, completion year. Reorder by drag. Pro/Elite: add 'Before/After' paired images. |
| Credentials Manager | Credentials Form | Add license: license type (dropdown of professional bodies) · license number · year issued · upload certificate image (S3). Multiple licenses supported. |
| FAQ Builder | Q&A Builder | Add Q&A pairs. AI suggests top 5 questions for your service category (Pro/Elite). Provider fills answers. |
| Social Links | URL Inputs | LinkedIn · Instagram · Facebook · Twitter/X · YouTube · Website. |

**PRV-04 Jobs & Project Tracker**

**Route:** /provider/jobs **Tier:** All Tiers

_Once a quote is accepted, the relationship becomes a job. This page tracks every active job from start to completion — keeping both provider and client aligned on status, deliverables, and payment._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Job Status Kanban | Kanban Board | Columns: Quoted → Accepted → In Progress → Awaiting Payment → Completed → Cancelled. Drag cards between columns (updates status). |
| Job Card | Kanban Card | Client name · service type · location · quoted amount · start date · due date · status pill. Quick-action: Message client. |
| Job Detail Drawer | Slide-in Panel | Full job detail: client info · service details · agreed amount · timeline milestones · file attachments · communication thread · payment status. |
| Milestone Tracker | Checklist | Provider adds milestones (e.g. 'Site visit', 'Draft report', 'Final delivery'). Each has a due date and done checkbox. Client visible (Pro/Elite). |
| Document Sharing | File Upload | Upload deliverables (PDF reports, survey plans, legal docs) — shared with client via secure pre-signed S3 URL. 7-day link expiry. |
| Mark Job Complete | Action Button | Triggers: client notification to confirm completion → both parties confirm → 'Job Verified' badge awarded to provider → automated review request sent. |
| Job Completion Report | AI Feature | Pro/Elite: AI generates a professional job completion summary PDF: provider name, client, service, scope, outcome, date. Provider downloads and shares. |
| Payment Milestone | Status Row | Track payment: Quote sent → Invoice issued → Partial payment → Full payment. Paystack payment link generator for client payment. |

**PRV-05 WhatsApp Bridge**

**Route:** /provider/whatsapp **Tier:** Pro & Elite

_Service providers receive a huge volume of service requests via WhatsApp. This connects their number to ServiceHub — automatically extracting and qualifying those requests as structured leads. Same architecture as AgentOS WhatsApp Bridge, adapted for service request context._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Connection State Machine | Two-State UI | Not Connected: QR code wizard (same as AGT-05). Connected: dashboard view. |
| Connected Dashboard | Status Panel | Number connected (masked) · Connection since · Last active · Message count today · Leads extracted this week. |
| Group Manager | Table | Groups monitored (ON/OFF per group) · member count · messages today · last import. 'Add Group Filter' — only import messages containing service request keywords. |
| Keyword Filter Config | Settings | Pro: set keywords to watch for ('I need a lawyer', 'urgently need survey', 'who knows a good photographer'). Only messages matching keywords are processed. |
| Extraction Queue | Card List | Pending extracted service requests: original message · AI extracted data (service type, location, budget, urgency) · confidence score · 'Import as Lead' / 'Reject' buttons. |
| Auto-Reply Templates | Template Manager | Manage WhatsApp auto-reply templates. E.g. 'Thanks for reaching out! I'll review your request and respond within 2 hours.' Available in English/Pidgin/Yoruba/Hausa. |
| Broadcast Lists | List Manager | Elite: manage client broadcast lists. Send service updates, promotions, follow-ups. |

**PRV-06 Analytics & Business Intelligence**

**Route:** /provider/analytics **Tier:** Pro & Elite (basic Free)

Same analytical depth as AgentOS Analytics, adapted for service provider metrics. 4 sections navigated by sticky sub-nav: Overview · Leads · Revenue · Match Performance.

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Lead Funnel Chart | Funnel | Leads received → Responded → Quoted → Accepted → Completed. Conversion % at each stage vs platform average for same category. |
| Response Time Chart | Bar Chart | Distribution of response times. Highlighted benchmark: 'Providers responding in <2h win 3× more jobs.' Agent's own distribution vs benchmark. |
| Revenue Chart | Bar Chart | Monthly revenue (accepted quote amounts). Rolling 12 months. Target line (provider-set). |
| Revenue by Service Type | Donut | Which services earn the most. Helps provider prioritise high-margin offerings. |
| Geographic Lead Heatmap | Mapbox Layer | Dots showing where leads originate. Density = demand. Helps provider decide which areas to prioritise or expand into. |
| Match Performance Panel | Unique Feature | How many times shown in contextual recommendations vs clicked vs converted to lead. 'You were shown 127 times this week and converted 14 (11%). Platform average: 8%.' |
| Top Listing Sources | Bar Chart | Which property listings generated the most leads for this provider. Agent referral attribution. |
| Seasonal Demand Trend | Line Chart | Lead volume by month, last 2 years (if data available). 'Q1 is typically your busiest — prepare capacity in December.' |

**PRV-07 Reviews & Reputation**

**Route:** /provider/reviews **Tier:** All Tiers

_Reputation is the single most important asset for a service provider on LandShoppers. This page gives providers full visibility and management tools for their public reputation._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Reputation Scorecard | Summary Card | Overall rating (large) · Sub-ratings breakdown (quality, communication, timeliness, value) · % of jobs verified · Total reviews · Trend vs last 90 days. |
| Review List | Review Cards | All reviews: star ratings (overall + sub-scores) · review body · date · 'Job Verified' badge · provider response (if posted) · 'Respond' button if no response yet. |
| Response Composer | Reply Form | Text area to write public response to a review. AI suggests a professional response (Pro/Elite). Character limit: 500. |
| AI Review Analysis | AI Panel | Pro/Elite: sentiment analysis of all reviews. 'Your most praised quality: Communication (mentioned in 78% of positive reviews). Most common complaint: Timeline delays (mentioned in 3 reviews). Suggested action: Add realistic delivery timeframes to your service listings.' |
| Review Request Tool | Action Panel | Select completed jobs without reviews → 'Send Review Request' → automated email/WhatsApp to client asking for a review. Track: sent/opened/reviewed. |
| Review Dispute | Report Form | If a review seems fraudulent or violates guidelines: 'Report This Review' → admin moderation queue. |

**PRV-08 Content & Social Tools**

**Route:** /provider/content **Tier:** Pro & Elite

_Just as AgentOS has a Content Studio for listings, Provider OS has one for service content. AI generates professional social content that positions the provider as a trusted expert — driving inbound leads from social media._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Content Type Selector | Radio Group | Portfolio Showcase · Service Explainer · Client Testimonial · Market Insight · Behind the Scenes · Promotion/Offer. |
| Input Context | Smart Form | Varies by type. Portfolio Showcase: select portfolio item → AI writes caption + hashtags. Service Explainer: select service type → AI explains it in buyer-friendly language. Testimonial: paste client's words → AI polishes it. |
| Generate Button | Primary Action | 'Generate Content' → returns: social caption (per channel) + hashtags + call to action + best time to post recommendation. |
| Channel Cards | Output Cards | One card per channel: Facebook · LinkedIn · Instagram · Twitter/X. Each shows character count, preview, copy button, schedule button. |
| Content Calendar | Month View | Same structure as AGT-08. Scheduled service provider posts across all connected channels. |
| Thought Leadership Pack | AI Feature | Elite: Monthly AI-generated 'Expert Insight' article for LinkedIn (800–1000 words) on a topic relevant to their service category e.g. 'The 5 Most Common Title Issues in Lagos Properties'. Positions provider as industry expert. |

**PRV-09 KYC & Verification**

**Route:** /provider/kyc **Tier:** All Tiers — Required for match ranking

_Professional service providers must be verified to appear in contextual matches and achieve high match scores. This page walks them through the 4-level verification journey with clear benefits at each level._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Verification Journey Strip | Progress Steps | 4 levels: Basic (email+phone) → Standard (BVN+ID) → Professional (license+2 references) → Elite (company+CAC+directors+proof of work). Each step unlocks specific features. |
| Level Detail Cards | Expandable Cards | Each level: what's required · what it unlocks · estimated review time · documents needed. Expand to see/submit. |
| Document Upload System | Upload Area | Category-specific required documents per service category: Lawyer=NBA certificate · Surveyor=SURCON license · Architect=ARCON certificate · Valuer=NIESV cert. AI reads uploaded PDFs (Pro/Elite) to validate format. |
| Professional Body Verification | Live Check | For licensed professions: enter license number → system checks against known professional body databases (where API available). Instant result. |
| Reference Submission | Reference Form | 2 professional references: name · company · phone · email. System sends email to referees requesting confirmation. |
| Verification Status Tracker | Timeline | Real-time status per document: Uploaded → Under Review → Approved/Rejected with reason. Expected review time shown. |
| Benefits Progress | Unlock Tracker | Visual tracker showing which features are locked behind each verification level. Gamifies completion. |

**PRV-10 Subscription & Billing**

**Route:** /provider/subscription **Tier:** All Tiers

_The monetisation page for service providers. Uses the same conversion psychology as AGT-10 — Free users see exactly what they're missing, Pro users see Elite's upside, and the framing is investment-return, not cost._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Current Plan Card | Summary | Plan badge · renewal date · usage meters (leads/month: 10 Free, 50 Pro, Unlimited Elite) · WhatsApp connections · content generations. |
| ROI Calculator | Interactive Tool | 'Enter your average job value → see how many jobs you need to pay for this subscription.' Pre-fills with: ₦150,000 avg job. 'At ₦150k/job, 1 additional job/month pays for your Pro subscription 10×.' Conversion psychology. |
| Plan Comparison Table | Pricing Table | Free vs Pro (₦15,000/mo) vs Elite (₦35,000/mo). Rows: Lead limit · AI scoring · WhatsApp bridge · Featured placement · Analytics · Content tools · Match score boost · Thought leadership content · Priority support. |
| Featured Placement | Add-On | Separate from subscription: buy featured placement in directory + contextual matches. ₦50,000/month. Limited slots per category per city. Shows remaining slots: 'Only 2 featured slots left for Legal providers in Lagos.' |
| Invoice History | Table | Date · plan · amount · status · download PDF. |
| Downgrade/Cancel Flow | Retention Modal | On cancel: shows jobs won this month, leads received, match appearances. 'You received 23 leads this month worth an estimated ₦690,000 in pipeline. Are you sure you want to cancel Pro?' |

**PRV-11 Settings & Integrations**

**Route:** /provider/settings **Tier:** All Tiers

_Operational controls: notifications, availability defaults, WhatsApp settings, linked accounts, security. Designed as a scannable, action-oriented command centre matching the developer settings design language._

| **Component** | **Type** | **Description & Behaviour** |
| --- | --- | --- |
| Notifications | Toggle Grid | New lead (instant SMS + email) · New review · Job marked complete · Quote accepted · Payment received · Weekly performance summary · Match score change alert. |
| Lead Preferences | Settings Group | Minimum lead budget filter (hide leads below ₦X) · Auto-reject leads outside service areas · Preferred lead sources (listing/directory/bundle/WhatsApp). |
| Availability Defaults | Settings Group | Default working hours Mon–Sun · Default response time commitment (shown on profile) · Auto-away message when outside working hours. |
| WhatsApp Integration | Summary Card | Bridge status. Link to PRV-05 full settings. Auto-reply toggle + preview. |
| Linked Social Accounts | OAuth Row | Facebook · Instagram · LinkedIn · Twitter/X. Same connect flow as AgentOS. |
| Quote Templates | Template Manager | Save reusable quote templates for common service types. Pre-populates quote builder in PRV-02. |
| Security | Action Rows | Password reset · 2FA (when API available) · Active sessions table · Login history. |
| Data & Privacy | Action Row | Download my data (NDPA 2023) · Profile visibility toggle · Analytics opt-out · Delete account. |

# **6\. ServiceHub AI Systems**

## **6.1 The Four AI Pipelines**

| **Pipeline** | **Trigger** | **What It Does** |
| --- | --- | --- |
| Contextual Match | Every listing detail page load | Computes top 5 providers per category for the listing's location + property type. |
| Lead Scoring | New service_lead created | Scores lead 0–100 based on message analysis, budget, timeline, source. |
| WhatsApp Extraction | Message arrives via Evolution API | Extracts service request type, location, budget, urgency from raw message text. |
| Content Generation | Provider requests via PRV-08 or auto-trigger | Generates social captions, portfolio showcases, thought leadership articles. |

## **6.2 Lead Scoring Prompt Design**

**LEAD SCORING CONTEXT** Unlike property leads (which score based on buyer conversation behaviour), service leads score based on the quality of the initial request. A lead with a stated budget, specific service type, clear location, and urgent timeline scores much higher than 'I might need a lawyer sometime'.

**Lead scoring factors:**

- Budget stated (+25 points): Any Naira amount mentioned. Range acceptable. Vague ('reasonable budget') = 0.
- Service specificity (+20 points): Exact service named ('title perfection') scores 20. Category named ('legal work') scores 10. Vague ('some legal stuff') scores 0.
- Location precision (+15 points): LGA+city known = 15. City only = 8. State only = 3. Unspecified = 0.
- Timeline urgency (+15 points): ASAP/specific date = 15. Within 1 month = 8. No timeline = 0.
- Completeness (+10 points): Phone number valid = 5. Email provided = 5.
- Source quality (+15 points): Listing page (in-transaction) = 15. Bundle activation = 12. Directory = 8. WhatsApp = 10. Direct = 6.

## **6.3 WhatsApp Service Request Extraction**

Extraction prompt targets service request messages specifically — distinct from the property listing extraction used in the platform WhatsApp module and AgentOS. The model detects:

- Request type: Is this a service request? (Not a listing, not a general question)
- Service category: Which of the 12 categories best matches?
- Sub-category: More specific service if determinable
- Location: Where does the client need this service?
- Budget: Any price signal — explicit amount, range, or vague qualifier
- Urgency: Timeline signals — ASAP, specific dates, flexible
- Sender context: Is the sender likely a buyer, agent, or developer?
- Confidence: 0–1 confidence score. <0.6 = do not auto-import, route to manual review

## **6.4 Quote Generator AI (Pro/Elite)**

The AI Quote Generator in PRV-02 takes the lead content and provider's service catalogue and generates a structured professional quote document:

- Line items extracted from provider's servicesOffered table + matched to client's request
- Market rate sanity check: if quote is >40% above or below category median, AI flags it with suggestion
- Professional language: rewrites any informal notes into formal quote language
- PDF output: styled PDF quote with provider branding, logo, terms, validity period, and payment bank details
- WhatsApp share: generates a formatted WhatsApp-friendly quote summary for providers who prefer to close via WhatsApp

## **6.5 AI Match Score Refresh Job**

The match score for every active provider is refreshed every 6 hours by a BullMQ job (provider-match-score-queue). The job recalculates aiMatchScore using the formula in Section 3.3. Triggers for immediate refresh:

- New verified review posted (trust score component changes)
- Verification level upgraded (verification component changes)
- Provider updates service areas (proximity component affected)
- Response to a lead recorded (response rate component changes)

# **7\. ServiceHub Business Model & Revenue Streams**

## **7.1 Five Revenue Streams**

| **#** | **Revenue Stream** | **Mechanism** | **Unit Economics** | **Year 1 Projection** |
| --- | --- | --- | --- | --- |
| 1   | Provider Subscriptions | Monthly recurring. Free → Pro (₦15k) → Elite (₦35k). Paystack auto-billing. | Pro: ₦15,000/mo. Elite: ₦35,000/mo. | 500 Pro + 100 Elite = ₦11M/mo |
| 2   | Featured Placement | ₦50,000/month per featured slot in directory + recommendations. Limited slots per category per city. | ₦50,000/slot/mo. 2 slots per category per city across 3 cities = 72 slots. | 50% occupancy = ₦1.8M/mo |
| 3   | Bundle Co-ordination Fee | 5% of total bundle GMV when a bundle is activated and all providers are matched. | Avg bundle: ₦500k GMV × 5% = ₦25,000 per activation. | 200 activations/mo = ₦5M/mo |
| 4   | Agent Referral Credits | Agents earn 10% of subscription fee for each provider they refer who subscribes. Platform keeps 90%. | Agent refers Pro provider = ₦1,500/mo recurring credit. | Incentivises agent network effect. |
| 5   | Boost Credits | Providers purchase credits (₦10k = 500 credits) to boost their profile in search results for 7 days outside their category/city. | ₦10,000 for 7-day slot boost. | 300 boosts/mo = ₦3M/mo |

**TOTAL PROJECTED MONTHLY REVENUE (Year 1): ₦20.8M/month · ₦249.6M/year**

## **7.2 Provider Tier Feature Matrix**

| **Feature** | **Free** | **Pro** | **Elite** | **Innovation Note** |
| --- | --- | --- | --- | --- |
| Provider profile + directory listing | **✓** | **✓** | **✓** | _Core offering — always free to join._ |
| Lead limit per month | 10  | 50  | Unlimited | _Scarcity drives upgrades on Free tier._ |
| AI Lead Scoring (0–100) | —   | **✓** | **✓** | _Single biggest conversion driver for providers._ |
| AI Reply Suggestions | —   | **✓** | **✓** | _Speeds up response time; reduces lead loss._ |
| WhatsApp Bridge (personal number) | —   | 1 number | Up to 3 numbers | _WhatsApp is where service requests live._ |
| Quote PDF Generator | Basic | ✓ Full | ✓ Branded | _Professional quotes close faster._ |
| AI Quote Market Rate Check | —   | **✓** | **✓** | _Prevents under/over-pricing._ |
| AI Job Completion Report | —   | **✓** | ✓ + PDF | _Impressive post-job deliverable to clients._ |
| Analytics (full suite) | Basic | **✓** | **✓** | _Match performance data only in Pro/Elite._ |
| Content & Social Tools | —   | **✓** | ✓ + Thought Leadership | _SEO and social presence for providers._ |
| Featured placement eligibility | —   | —   | ✓ (add-on) | _Elite providers can purchase featured slots._ |
| Contextual match priority boost | Basic (1×) | Standard (1.5×) | Priority (2×) | _Elite providers appear first in matches._ |
| Review Response AI | —   | **✓** | ✓ Sentiment-aware | _Helps providers craft professional responses._ |
| Availability calendar | Basic | **✓** | ✓ + client visible | _Clients see availability before requesting._ |
| Team member sub-accounts | —   | —   | Up to 3 | _For multi-person service firms._ |

# **8\. ServiceHub Sprint Delivery Plan — 4 Sprints · 8 Weeks**

_ServiceHub is delivered in 4 dedicated sprints running in parallel with or after the core LandShoppers Sprint 5–8 delivery. The match engine and public marketplace (Sprint A+B) are the highest priority as they generate immediate value for existing platform users._

## **8.1 Sprint Summary**

| **Sprint** | **Weeks** | **Theme** | **Key Deliverable** |
| --- | --- | --- | --- |
| Sprint A | 1–2 | Foundation | Provider registration, directory, all 9 tables, services homepage |
| Sprint B | 3–4 | Match Engine + Profiles | Contextual match live on listing pages, full provider profiles, Provider Command Center |
| Sprint C | 5–6 | Lead Inbox + WhatsApp + Jobs | AI lead scoring, WhatsApp bridge, jobs tracker, per-provider connections |
| Sprint D | 7–8 | Bundles + Payments + Launch | Bundle packages, Paystack billing, full analytics, KYC, public launch with 50 seed providers |

## **8.2 Sprint Story Detail**

### **Sprint A (Weeks Weeks 1–2) — ServiceHub Foundation**

| **Ticket** | **Assignee** | **Story** | **Points** |
| --- | --- | --- | --- |
| SHB-001 | Chidi+Emeka | Prisma schema: all 9 new ServiceHub tables + migrations | 8   |
| SHB-002 | Emeka | Service provider registration API + RBAC role: service_provider | 8   |
| SHB-003 | Amara | SVC-PUB-06 Provider onboarding flow (registration wizard) | 8   |
| SHB-004 | Emeka | GET /api/v1/services with full filtering + PostGIS geo-search | 13  |
| SHB-005 | Amara | SVC-PUB-01 Services homepage + SVC-PUB-02 Directory page | 13  |
| SHB-006 | Kelechi | ServiceHub design system: orange accent palette, service category icons | 5   |
| SHB-007 | Fatima | Service provider registration security tests + KYC submission tests | 5   |

### **Sprint B (Weeks Weeks 3–4) — Provider Profile + Contextual Match Engine**

| **Ticket** | **Assignee** | **Story** | **Points** |
| --- | --- | --- | --- |
| SHB-010 | Chidi | Contextual match engine: scoring algorithm + BullMQ match score refresh job | 13  |
| SHB-011 | Amara | SVC-PUB-03 Provider profile page (full public view) | 13  |
| SHB-012 | Amara | SVC-PUB-05 Contextual match block embedded in PUB-03 listing detail | 8   |
| SHB-013 | Emeka | POST /api/v1/services/:slug/quote — service lead creation + email alert | 5   |
| SHB-014 | Emeka | PRV-01 Provider Command Center API: dashboard aggregate endpoint | 8   |
| SHB-015 | Amara | PRV-01 Provider Command Center UI + PRV-03 Profile editor | 13  |
| SHB-016 | Fatima | Contextual match result tests + lead creation security audit | 5   |

### **Sprint C (Weeks Weeks 5–6) — Lead Inbox, Jobs, WhatsApp + AI Scoring**

| **Ticket** | **Assignee** | **Story** | **Points** |
| --- | --- | --- | --- |
| SHB-020 | Emeka | AI Lead Scoring service: FastAPI endpoint /score-service-lead | 8   |
| SHB-021 | Emeka | Evolution API bridge adaptation for per-provider connections | 8   |
| SHB-022 | Chidi | WhatsApp service request extraction prompt + LangChain parser | 13  |
| SHB-023 | Amara | PRV-02 Lead Inbox + PRV-05 WhatsApp Bridge UI | 13  |
| SHB-024 | Amara | PRV-04 Jobs & Project Tracker (kanban + job detail drawer) | 8   |
| SHB-025 | Emeka | Service lead status workflow + job completion flow + review trigger | 8   |
| SHB-026 | Fatima | Lead scoring accuracy tests + WhatsApp extraction quality tests | 5   |

### **Sprint D (Weeks Weeks 7–8) — Bundles, Payments, Analytics + Launch**

| **Ticket** | **Assignee** | **Story** | **Points** |
| --- | --- | --- | --- |
| SHB-030 | Chidi | Bundle activation engine: multi-lead creation + match + co-ordination fee | 13  |
| SHB-031 | Amara | SVC-PUB-04 Bundle packages page + activation wizard | 8   |
| SHB-032 | Emeka | Paystack subscription billing for provider Pro/Elite plans | 8   |
| SHB-033 | Emeka | Featured placement payment + slot management API | 5   |
| SHB-034 | Amara | PRV-06 Analytics + PRV-07 Reviews + PRV-08 Content + PRV-10 Billing | 13  |
| SHB-035 | Amara | PRV-09 KYC + PRV-11 Settings + Admin ServiceHub panel (ADM extensions) | 8   |
| SHB-036 | Fatima | Full E2E test suite for ServiceHub: registration → quote → job complete → review | 8   |
| SHB-037 | All | ServiceHub launch: seed 50 verified providers across 4 categories in Lagos | 5   |

# **9\. ServiceHub Launch Strategy & Growth Loops**

## **9.1 Seed Provider Strategy (Pre-Launch)**

**CHICKEN-AND-EGG SOLUTION** ServiceHub has no value without providers. Before launching the public marketplace, Stacklane and the LandShoppers team must manually source and onboard 50 verified providers across the 4 highest-demand categories in Lagos. These providers are given 6 months of Pro tier free in exchange for being founding members and providing feedback.

| **Category** | **Target Count** | **Verification** | **Founding Benefit** |
| --- | --- | --- | --- |
| Legal & Title | 15  | Professional (NBA) | 6 months Pro free + 'Founding Member' badge + featured placement Month 1 |
| Survey & Mapping | 10  | Professional (SURCON) | 6 months Pro free + Founding Member badge |
| Photography & Media | 10  | Standard (portfolio review) | 6 months Pro free + Founding Member badge |
| Valuation | 10  | Professional (NIESV) | 6 months Pro free + Founding Member badge |
| Mortgage Advisors | 5   | Standard | 6 months Pro free + Founding Member badge |

## **9.2 Growth Loops**

| **Growth Loop** | **How It Works** |
| --- | --- |
| Contextual Match Loop | More listings → more contextual matches → more leads for providers → providers invest in platform → better verification → higher match scores → more matches on more listings. |
| Agent Referral Loop | Agents refer service providers → providers join + subscribe → agents earn referral credits → agents refer more providers → ServiceHub grows without paid acquisition. |
| Review Compounding Loop | Completed job → automated review request → new review → higher match score → shown to more buyers → more jobs → more reviews. |
| Bundle Discovery Loop | Bundle activated → 5 providers matched → 5 providers discover platform value → some become paying subscribers → they generate positive reviews → bundle trust increases → more bundle activations. |
| WhatsApp Extraction Loop | Provider connects WhatsApp → receives service requests they were missing → converts more → refers colleagues → colleagues join → more coverage → better matching for buyers. |

## **9.3 Success Metrics — ServiceHub**

| **Metric** | **Month 1 Target** | **Month 6 Target** | **Year 1 Target** |
| --- | --- | --- | --- |
| Verified providers live | 50  | 300 | 1,000 |
| Service leads generated/month | 200 | 2,000 | 10,000 |
| Lead-to-job conversion rate | 15% | 25% | 35% |
| Bundle activations/month | 20  | 150 | 500 |
| Paying subscribers (Pro+Elite) | 10  | 200 | 600 |
| ServiceHub GMV/month | ₦5M | ₦50M | ₦200M |
| LandShoppers revenue from ServiceHub/month | ₦500k | ₦5M | ₦20M |
| Avg match click-through rate | 5%  | 10% | 15% |
| Provider NPS score | 40  | 55  | 70  |

STACKLANE TECHNOLOGIES LTD · ServiceHub Ecosystem Specification v1.0 · LandShoppers v1.1

Chidi Okonkwo, Software Architect · May 2026 · Confidential

_From Land to Completion in One Ecosystem._