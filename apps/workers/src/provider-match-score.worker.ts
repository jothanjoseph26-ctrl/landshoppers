import type { ProviderVerificationLevel } from "@landshoppers/db";
import { createPrismaClient } from "@landshoppers/db";
import { computeProviderBaselineAiScore } from "@landshoppers/servicehub-match";
import type { Job } from "bullmq";
import { Worker } from "bullmq";
import type { Redis } from "ioredis";

import {
  DLQ_PROVIDER_MATCH_SCORE,
  QUEUE_PROVIDER_MATCH_SCORE,
} from "./constants.js";
import { attachDeadLetterHandler } from "./dlq.js";

const prisma = createPrismaClient();

const BATCH = 100;

type BaselineRow = {
  id: string;
  rating: number;
  reviewCount: number;
  completedJobCount: number;
  responseRatePercent: number;
  verificationLevel: string;
  has_geom: boolean;
};

function parseVerification(level: string): ProviderVerificationLevel {
  const allowed = new Set<ProviderVerificationLevel>([
    "basic",
    "standard",
    "professional",
    "elite",
  ]);
  if (allowed.has(level as ProviderVerificationLevel)) {
    return level as ProviderVerificationLevel;
  }
  return "basic";
}

async function refreshSingleProvider(serviceProviderId: string): Promise<{ updated: boolean }> {
  const rows = await prisma.$queryRaw<BaselineRow[]>`
    SELECT sp.id::text AS id,
      sp.rating::double precision AS rating,
      sp."reviewCount" AS "reviewCount",
      sp."completedJobCount" AS "completedJobCount",
      sp."responseRatePercent" AS "responseRatePercent",
      sp."verificationLevel"::text AS "verificationLevel",
      (sp.geom IS NOT NULL) AS has_geom
    FROM service_providers sp
    WHERE sp.id = ${serviceProviderId}::uuid
      AND sp."deletedAt" IS NULL
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return { updated: false };

  const score = computeProviderBaselineAiScore({
    rating: row.rating,
    reviewCount: row.reviewCount,
    completedJobCount: row.completedJobCount,
    responseRatePercent: row.responseRatePercent,
    verificationLevel: parseVerification(row.verificationLevel),
    hasGeom: row.has_geom,
  });

  await prisma.serviceProvider.update({
    where: { id: row.id },
    data: { aiMatchScore: score },
  });
  return { updated: true };
}

async function refreshAllProviders(): Promise<{ updated: number }> {
  let lastId: string | null = null;
  let updated = 0;

  for (;;) {
    let rows: BaselineRow[];
    if (lastId === null) {
      rows = await prisma.$queryRaw<BaselineRow[]>`
            SELECT sp.id::text AS id,
              sp.rating::double precision AS rating,
              sp."reviewCount" AS "reviewCount",
              sp."completedJobCount" AS "completedJobCount",
              sp."responseRatePercent" AS "responseRatePercent",
              sp."verificationLevel"::text AS "verificationLevel",
              (sp.geom IS NOT NULL) AS has_geom
            FROM service_providers sp
            WHERE sp."deletedAt" IS NULL
            ORDER BY sp.id ASC
            LIMIT ${BATCH}
          `;
    } else {
      rows = await prisma.$queryRaw<BaselineRow[]>`
            SELECT sp.id::text AS id,
              sp.rating::double precision AS rating,
              sp."reviewCount" AS "reviewCount",
              sp."completedJobCount" AS "completedJobCount",
              sp."responseRatePercent" AS "responseRatePercent",
              sp."verificationLevel"::text AS "verificationLevel",
              (sp.geom IS NOT NULL) AS has_geom
            FROM service_providers sp
            WHERE sp."deletedAt" IS NULL
              AND sp.id > ${lastId}::uuid
            ORDER BY sp.id ASC
            LIMIT ${BATCH}
          `;
    }

    if (rows.length === 0) break;

    for (const row of rows) {
      const score = computeProviderBaselineAiScore({
        rating: row.rating,
        reviewCount: row.reviewCount,
        completedJobCount: row.completedJobCount,
        responseRatePercent: row.responseRatePercent,
        verificationLevel: parseVerification(row.verificationLevel),
        hasGeom: row.has_geom,
      });

      await prisma.serviceProvider.update({
        where: { id: row.id },
        data: { aiMatchScore: score },
      });
      updated += 1;
    }

    lastId = rows[rows.length - 1].id;
  }

  return { updated };
}

/**
 * BullMQ payload for provider AI match score refresh (§6.5).
 * Sprint B: baseline §3.3-derived score persisted on `service_providers.aiMatchScore`.
 */
export type ProviderMatchScoreJobPayload =
  | { trigger: "scheduled_full_refresh" }
  | { trigger: "single_provider"; serviceProviderId: string };

export function startProviderMatchScoreWorker(connection: Redis): Worker {
  const worker = new Worker(
    QUEUE_PROVIDER_MATCH_SCORE,
    async (job: Job<ProviderMatchScoreJobPayload>) => {
      try {
        if (job.data.trigger === "single_provider") {
          const r = await refreshSingleProvider(job.data.serviceProviderId);
          return { phase: "B" as const, scope: "single", ...r };
        }
        const r = await refreshAllProviders();
        console.log(`[${QUEUE_PROVIDER_MATCH_SCORE}] full refresh updated ${r.updated} providers`);
        return { phase: "B" as const, scope: "full", ...r };
      } catch (err) {
        console.error(`[${QUEUE_PROVIDER_MATCH_SCORE}] failed`, job.id, err);
        throw err;
      }
    },
    { connection, concurrency: 1 },
  );

  worker.on("completed", (job) => {
    console.log(`[${QUEUE_PROVIDER_MATCH_SCORE}] completed`, job.id);
  });

  attachDeadLetterHandler(
    connection,
    QUEUE_PROVIDER_MATCH_SCORE,
    DLQ_PROVIDER_MATCH_SCORE,
    worker,
  );

  return worker;
}
