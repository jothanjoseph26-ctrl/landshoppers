-- ServiceHub foundation (spec §2): expand `service_providers`, add 8 adjacent tables, new enums.

-- Expand catalog enum (§1.4)
ALTER TYPE "ServiceCategory" ADD VALUE 'valuation';
ALTER TYPE "ServiceCategory" ADD VALUE 'cleaning_moving';
ALTER TYPE "ServiceCategory" ADD VALUE 'home_technology';
ALTER TYPE "ServiceCategory" ADD VALUE 'inspection';

-- New enums
CREATE TYPE "ProviderVerificationLevel" AS ENUM ('basic', 'standard', 'professional', 'elite');
CREATE TYPE "ProviderTier" AS ENUM ('free', 'pro', 'elite');
CREATE TYPE "ServiceLeadSource" AS ENUM ('listing_page', 'directory', 'bundle', 'whatsapp', 'agent_referral', 'developer_rfq', 'post_purchase');
CREATE TYPE "ServiceLeadStatus" AS ENUM ('pending', 'responded', 'quoted', 'negotiating', 'accepted', 'completed', 'cancelled', 'lost');
CREATE TYPE "ServiceBundleTrigger" AS ENUM ('post_purchase', 'listing_create', 'developer_project', 'diaspora', 'off_plan');
CREATE TYPE "BundleActivationStatus" AS ENUM ('initiated', 'providers_matched', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "ProviderWhatsAppStatus" AS ENUM ('connected', 'disconnected', 'error');

-- ---------------------------------------------------------------------------
-- service_providers: ServiceHub columns + migrate legacy `services` / premium
-- ---------------------------------------------------------------------------
ALTER TABLE "service_providers" ADD COLUMN "subCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "service_providers" ADD COLUMN "servicesOffered" JSONB;
UPDATE "service_providers" SET "servicesOffered" = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', elem,
        'description', NULL,
        'priceFrom', NULL,
        'priceTo', NULL,
        'unit', NULL,
        'deliveryDays', NULL
      )
    )
    FROM unnest(COALESCE("services", ARRAY[]::TEXT[])) AS elem
  ),
  '[]'::jsonb
);
ALTER TABLE "service_providers" ALTER COLUMN "servicesOffered" SET NOT NULL;
ALTER TABLE "service_providers" ALTER COLUMN "servicesOffered" SET DEFAULT '[]'::jsonb;

ALTER TABLE "service_providers" ADD COLUMN "serviceAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "service_providers" ADD COLUMN "whatsappPhone" TEXT;
ALTER TABLE "service_providers" ADD COLUMN "verificationLevel" "ProviderVerificationLevel" NOT NULL DEFAULT 'basic';
ALTER TABLE "service_providers" ADD COLUMN "kycDocuments" JSONB;
ALTER TABLE "service_providers" ADD COLUMN "licenseNumber" TEXT;
ALTER TABLE "service_providers" ADD COLUMN "licenseBody" TEXT;
ALTER TABLE "service_providers" ADD COLUMN "completedJobCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "service_providers" ADD COLUMN "responseRatePercent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "service_providers" ADD COLUMN "avgResponseHours" DOUBLE PRECISION;
ALTER TABLE "service_providers" ADD COLUMN "aiMatchScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "service_providers" ADD COLUMN "subscriptionTier" "ProviderTier" NOT NULL DEFAULT 'free';
UPDATE "service_providers" SET "subscriptionTier" = 'pro' WHERE "isPremium" = true;

ALTER TABLE "service_providers" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
UPDATE "service_providers" SET "isFeatured" = true WHERE "isPremium" = true;
ALTER TABLE "service_providers" ADD COLUMN "featuredUntil" TIMESTAMP(3);
UPDATE "service_providers" SET "featuredUntil" = "premiumUntil" WHERE "premiumUntil" IS NOT NULL;

ALTER TABLE "service_providers" ADD COLUMN "whatsappConnected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "service_providers" ADD COLUMN "portfolioItems" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "service_providers" ADD COLUMN "teamSize" INTEGER;
ALTER TABLE "service_providers" ADD COLUMN "foundedYear" INTEGER;

ALTER TABLE "service_providers" ADD COLUMN "geom" geography(Point, 4326);

ALTER TABLE "service_providers" DROP COLUMN "services";
ALTER TABLE "service_providers" DROP COLUMN "isPremium";
ALTER TABLE "service_providers" DROP COLUMN "premiumUntil";

DROP INDEX IF EXISTS "service_providers_isPremium_idx";

CREATE INDEX "service_providers_geom_idx" ON "service_providers" USING GIST ("geom");
CREATE INDEX "service_providers_isFeatured_idx" ON "service_providers" ("isFeatured");
CREATE INDEX "service_providers_subscriptionTier_idx" ON "service_providers" ("subscriptionTier");
CREATE INDEX "service_providers_aiMatchScore_idx" ON "service_providers" ("aiMatchScore");

-- Approximate geocoding for seeded rows (Stream 4 can refine)
UPDATE "service_providers" SET "geom" = ST_SetSRID(ST_MakePoint(3.3792, 6.5244), 4326)::geography
WHERE "city" ILIKE 'Lagos%' OR "state" ILIKE 'Lagos';
UPDATE "service_providers" SET "geom" = ST_SetSRID(ST_MakePoint(7.3986, 9.0765), 4326)::geography
WHERE ("city" ILIKE 'Abuja%' OR "state" ILIKE 'FCT') AND "geom" IS NULL;
UPDATE "service_providers" SET "geom" = ST_SetSRID(ST_MakePoint(7.0498, 4.8156), 4326)::geography
WHERE ("city" ILIKE 'Port Harcourt%' OR "state" ILIKE 'Rivers') AND "geom" IS NULL;
UPDATE "service_providers" SET "geom" = ST_SetSRID(ST_MakePoint(3.947, 7.3775), 4326)::geography
WHERE ("city" ILIKE 'Ibadan%' OR "state" ILIKE 'Oyo') AND "geom" IS NULL;

-- ---------------------------------------------------------------------------
-- New tables (§2.2 tables 2–9)
-- ---------------------------------------------------------------------------
CREATE TABLE "service_leads" (
    "id" UUID NOT NULL,
    "serviceProviderId" UUID NOT NULL,
    "clientUserId" UUID,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientEmail" TEXT,
    "source" "ServiceLeadSource" NOT NULL,
    "listingId" UUID,
    "projectId" UUID,
    "bundleId" UUID,
    "serviceRequested" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "budget" BIGINT,
    "timeline" TEXT,
    "location" TEXT NOT NULL,
    "status" "ServiceLeadStatus" NOT NULL DEFAULT 'pending',
    "aiScore" DOUBLE PRECISION,
    "aiSummary" TEXT,
    "quotedAmountKobo" BIGINT,
    "finalAmountKobo" BIGINT,
    "respondedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_bundles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categories" "ServiceCategory"[],
    "priceFromKobo" BIGINT NOT NULL,
    "priceToKobo" BIGINT NOT NULL,
    "triggerContext" "ServiceBundleTrigger" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activationCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "service_bundles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bundle_activations" (
    "id" UUID NOT NULL,
    "bundleId" UUID NOT NULL,
    "clientUserId" UUID NOT NULL,
    "listingId" UUID,
    "status" "BundleActivationStatus" NOT NULL,
    "matchedProviders" JSONB NOT NULL,
    "totalAmountKobo" BIGINT,
    "platformFeeKobo" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundle_activations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_reviews" (
    "id" UUID NOT NULL,
    "serviceLeadId" UUID NOT NULL,
    "serviceProviderId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "qualityRating" INTEGER NOT NULL,
    "communicationRating" INTEGER NOT NULL,
    "timelinessRating" INTEGER NOT NULL,
    "valueRating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isJobVerified" BOOLEAN NOT NULL DEFAULT false,
    "providerResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_whatsapp_connections" (
    "id" UUID NOT NULL,
    "serviceProviderId" UUID NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "evolutionInstanceName" TEXT NOT NULL,
    "status" "ProviderWhatsAppStatus" NOT NULL,
    "monitoredGroups" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "extractedLeadsCount" INTEGER NOT NULL DEFAULT 0,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "provider_whatsapp_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_availability" (
    "id" UUID NOT NULL,
    "serviceProviderId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "isAvailable" BOOLEAN NOT NULL,
    "slots" JSONB,
    "note" TEXT,

    CONSTRAINT "provider_availability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_ai_match_log" (
    "id" UUID NOT NULL,
    "serviceProviderId" UUID NOT NULL,
    "listingId" UUID,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "scoreFactors" JSONB NOT NULL,
    "position" INTEGER NOT NULL,
    "wasClicked" BOOLEAN NOT NULL DEFAULT false,
    "convertedToLead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_ai_match_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_preferred_partners" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "serviceProviderId" UUID NOT NULL,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "earnedCreditsKobo" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_preferred_partners_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "service_leads" ADD CONSTRAINT "service_leads_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_leads" ADD CONSTRAINT "service_leads_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_leads" ADD CONSTRAINT "service_leads_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_leads" ADD CONSTRAINT "service_leads_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "developer_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_leads" ADD CONSTRAINT "service_leads_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "service_bundles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bundle_activations" ADD CONSTRAINT "bundle_activations_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "service_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bundle_activations" ADD CONSTRAINT "bundle_activations_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bundle_activations" ADD CONSTRAINT "bundle_activations_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_serviceLeadId_fkey" FOREIGN KEY ("serviceLeadId") REFERENCES "service_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "provider_whatsapp_connections" ADD CONSTRAINT "provider_whatsapp_connections_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "provider_ai_match_log" ADD CONSTRAINT "provider_ai_match_log_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_ai_match_log" ADD CONSTRAINT "provider_ai_match_log_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "agent_preferred_partners" ADD CONSTRAINT "agent_preferred_partners_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_preferred_partners" ADD CONSTRAINT "agent_preferred_partners_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "service_bundles_slug_key" ON "service_bundles"("slug");
CREATE INDEX "service_bundles_isActive_idx" ON "service_bundles" ("isActive");
CREATE INDEX "service_bundles_triggerContext_idx" ON "service_bundles" ("triggerContext");

CREATE INDEX "service_leads_serviceProviderId_idx" ON "service_leads" ("serviceProviderId");
CREATE INDEX "service_leads_clientUserId_idx" ON "service_leads" ("clientUserId");
CREATE INDEX "service_leads_listingId_idx" ON "service_leads" ("listingId");
CREATE INDEX "service_leads_status_idx" ON "service_leads" ("status");
CREATE INDEX "service_leads_source_idx" ON "service_leads" ("source");

CREATE INDEX "bundle_activations_bundleId_idx" ON "bundle_activations" ("bundleId");
CREATE INDEX "bundle_activations_clientUserId_idx" ON "bundle_activations" ("clientUserId");

CREATE UNIQUE INDEX "service_reviews_serviceLeadId_key" ON "service_reviews"("serviceLeadId");
CREATE INDEX "service_reviews_serviceProviderId_idx" ON "service_reviews" ("serviceProviderId");
CREATE INDEX "service_reviews_reviewerId_idx" ON "service_reviews" ("reviewerId");

CREATE INDEX "provider_whatsapp_connections_serviceProviderId_idx" ON "provider_whatsapp_connections" ("serviceProviderId");

CREATE INDEX "provider_availability_serviceProviderId_date_idx" ON "provider_availability" ("serviceProviderId", "date");

CREATE INDEX "provider_ai_match_log_serviceProviderId_idx" ON "provider_ai_match_log" ("serviceProviderId");
CREATE INDEX "provider_ai_match_log_listingId_idx" ON "provider_ai_match_log" ("listingId");

CREATE UNIQUE INDEX "agent_preferred_partners_agentId_serviceProviderId_key" ON "agent_preferred_partners"("agentId", "serviceProviderId");
CREATE INDEX "agent_preferred_partners_agentId_idx" ON "agent_preferred_partners" ("agentId");
