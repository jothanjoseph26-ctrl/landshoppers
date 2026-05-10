import type { Redis } from "ioredis";
import { ListingStatus, createPrismaClient } from "@landshoppers/db";
import type { Job } from "bullmq";
import { Worker } from "bullmq";
import {
  DEFAULT_LISTINGS_INDEX_NAME,
  listingOpenSearchDocument,
  type ListingIndexSource,
} from "@landshoppers/search-listing";
import { Client } from "@opensearch-project/opensearch";

import { DLQ_LISTING_INDEX, QUEUE_LISTING_INDEX } from "./constants.js";
import { attachDeadLetterHandler } from "./dlq.js";

export function startListingIndexWorker(connection: Redis): Worker {
  const nodeUrl = (process.env.OPENSEARCH_URL ?? "http://127.0.0.1:9200").replace(/\/$/, "");
  const index = process.env.OPENSEARCH_LISTINGS_INDEX ?? DEFAULT_LISTINGS_INDEX_NAME;

  let os: Client;
  try {
    os = new Client({ node: nodeUrl });
  } catch (e) {
    console.error(`[${QUEUE_LISTING_INDEX}] OpenSearch client init failed`, e);
    throw e;
  }

  const prisma = createPrismaClient();

  const worker = new Worker(
    QUEUE_LISTING_INDEX,
    async (job: Job<{ listingId: string }>) => {
      const { listingId } = job.data;

      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          property: { include: { features: true } },
          agent: { select: { verificationBadge: true } },
        },
      });

      const shouldRemove =
        !listing || listing.deletedAt || listing.property.deletedAt || listing.status !== ListingStatus.active;

      if (shouldRemove) {
        await os.delete({ index, id: listingId }).catch(() => {});
        return { removed: true };
      }

      const features = listing.property.features.map((f) => f.feature);
      const docSource: ListingIndexSource = {
        listingId: listing.id,
        propertySlug: listing.property.slug,
        title: listing.property.title,
        description: listing.property.description,
        city: listing.property.city,
        state: listing.property.state,
        country: listing.property.country,
        propertyType: listing.property.propertyType,
        price: listing.price,
        bedrooms: listing.property.bedrooms,
        bathrooms: listing.property.bathrooms,
        isForSale: listing.isForSale,
        isForRent: listing.isForRent,
        verificationBadge: listing.agent?.verificationBadge ?? false,
        publishedAt: listing.publishedAt,
        createdAt: listing.createdAt,
        latitude: listing.property.latitude,
        longitude: listing.property.longitude,
        features,
      };

      await os.index({
        index,
        id: listingId,
        body: listingOpenSearchDocument(docSource),
        refresh: true,
      });
      return { indexed: true };
    },
    { connection, concurrency: 4 },
  );

  worker.on("completed", (job) => console.log(`[${QUEUE_LISTING_INDEX}] indexed`, job.id));

  attachDeadLetterHandler(connection, QUEUE_LISTING_INDEX, DLQ_LISTING_INDEX, worker);

  return worker;
}
