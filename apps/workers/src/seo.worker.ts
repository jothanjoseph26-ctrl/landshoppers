import { SeoVariantStatus, createPrismaClient } from "@landshoppers/db";
import { Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";

import { DLQ_SEO_GENERATION, QUEUE_SEO_GENERATION } from "./constants.js";
import { attachDeadLetterHandler } from "./dlq.js";

const prisma = createPrismaClient();

export type SeoGenerationJobPayload = {
  listingId: string;
  listingTitle?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  descriptionHint?: string;
};

export function startSeoGenerationWorker(connection: Redis): Worker {
  const aiUrl = (process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

  const worker = new Worker(
    QUEUE_SEO_GENERATION,
    async (job: Job<SeoGenerationJobPayload>) => {
      const res = await fetch(`${aiUrl}/generate-seo-variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job.data),
      });

      const responseText = await res.text();
      let rawJson: Record<string, unknown> = {};
      try {
        rawJson = JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        rawJson = { detail: responseText };
      }

      if (!res.ok) {
        const msg =
          typeof rawJson["detail"] === "string"
            ? rawJson["detail"]
            : responseText || JSON.stringify(rawJson);
        throw new Error(`generate-seo-variants failed: HTTP ${res.status} ${msg}`);
      }

      const listingId = job.data.listingId;
      const variants = rawJson["variants"];
      if (!Array.isArray(variants)) {
        throw new Error("generate-seo-variants: missing variants array");
      }

      await prisma.listingSeoVariant.deleteMany({
        where: { listingId, status: SeoVariantStatus.draft },
      });

      for (const v of variants) {
        const o = v as Record<string, unknown>;
        await prisma.listingSeoVariant.create({
          data: {
            listingId,
            variantType: String(o["variantType"] ?? "seo_long"),
            seoTitle: (o["seoTitle"] as string | null | undefined) ?? null,
            metaDescription: (o["metaDescription"] as string | null | undefined) ?? null,
            hashtags: Array.isArray(o["hashtags"]) ? (o["hashtags"] as string[]) : [],
            fullCopy: (o["fullCopy"] as string | null | undefined) ?? null,
            socialCaption: (o["socialCaption"] as string | null | undefined) ?? null,
            tone: (o["tone"] as string | null | undefined) ?? null,
            targetAudience: (o["targetAudience"] as string | null | undefined) ?? null,
            status: SeoVariantStatus.draft,
          },
        });
      }

      return { persisted: variants.length, listingId };
    },
    {
      connection,
      concurrency: 2,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[${QUEUE_SEO_GENERATION}] completed`, job.id);
  });

  attachDeadLetterHandler(connection, QUEUE_SEO_GENERATION, DLQ_SEO_GENERATION, worker);

  return worker;
}
