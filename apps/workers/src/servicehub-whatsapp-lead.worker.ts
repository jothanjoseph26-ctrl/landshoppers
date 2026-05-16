import {
  NotificationType,
  ProviderWhatsAppStatus,
  ServiceLeadSource,
  createPrismaClient,
} from "@landshoppers/db";
import {
  extractServiceRequestFromText,
  scoreServiceLeadHeuristic,
} from "@landshoppers/servicehub-match";
import type { Job } from "bullmq";
import { Worker } from "bullmq";
import type { Redis } from "ioredis";

import {
  DLQ_SERVICEHUB_WHATSAPP_LEAD,
  QUEUE_SERVICEHUB_WHATSAPP_LEAD,
} from "./constants.js";
import { attachDeadLetterHandler } from "./dlq.js";

const prisma = createPrismaClient();

export type ServicehubWhatsAppLeadPayload = {
  rawMessageId: string;
  messageId: string;
  textContent?: string;
  mediaUrls?: string[];
  senderPhone: string;
  senderName?: string;
  groupId?: string;
  groupName?: string;
};

function normalizeNgPhone(input: string): string {
  const d = input.replace(/\D/g, "");
  if (d.startsWith("234") && d.length >= 13) return `+${d}`;
  if (d.startsWith("0") && d.length === 11) return `+234${d.slice(1)}`;
  if (d.length === 10) return `+234${d}`;
  return input.startsWith("+") ? input : `+${d}`;
}

function monitorsGroup(monitored: unknown, groupId: string | undefined): boolean {
  if (!groupId) return false;
  if (!Array.isArray(monitored)) return false;
  return monitored.some((x) => String(x) === groupId);
}

export function startServicehubWhatsAppLeadWorker(connection: Redis): Worker {
  const worker = new Worker(
    QUEUE_SERVICEHUB_WHATSAPP_LEAD,
    async (job: Job<ServicehubWhatsAppLeadPayload>) => {
      const payload = job.data;

      const rawRow = await prisma.rawWhatsAppMessage.findUnique({
        where: { id: payload.rawMessageId },
      });
      if (!rawRow) {
        console.warn(`[${QUEUE_SERVICEHUB_WHATSAPP_LEAD}] unknown rawMessage`, payload.rawMessageId);
        return { skipped: true as const, reason: "unknown_raw" };
      }

      const text = (payload.textContent ?? rawRow.textContent ?? "").trim();
      const extracted = extractServiceRequestFromText(text);

      const prevExtract = (rawRow.extractedData as Record<string, unknown> | null) ?? {};
      await prisma.rawWhatsAppMessage.update({
        where: { id: payload.rawMessageId },
        data: {
          extractedData: {
            ...prevExtract,
            servicehubPhaseC: extracted,
          } as object,
        },
      });

      if (!extracted.isServiceRequest || extracted.confidence < 0.6) {
        return { skipped: true as const, reason: "below_threshold", confidence: extracted.confidence };
      }

      if (!payload.groupId) {
        return { skipped: true as const, reason: "missing_group_id" };
      }

      const connections = await prisma.providerWhatsAppConnection.findMany({
        where: { status: ProviderWhatsAppStatus.connected },
      });

      const conn =
        connections.find((c) => monitorsGroup(c.monitoredGroups, payload.groupId)) ?? null;
      if (!conn) {
        return { skipped: true as const, reason: "no_provider_monitoring_group" };
      }

      const normalizedPhone = normalizeNgPhone(payload.senderPhone);

      const duplicate = await prisma.serviceLead.findFirst({
        where: {
          serviceProviderId: conn.serviceProviderId,
          clientPhone: normalizedPhone,
          createdAt: { gte: new Date(Date.now() - 86400000) },
          message: text.slice(0, 500),
        },
      });
      if (duplicate) {
        return { skipped: true as const, reason: "duplicate_24h" };
      }

      const provider = await prisma.serviceProvider.findFirst({
        where: { id: conn.serviceProviderId, deletedAt: null },
        select: { id: true, userId: true },
      });
      if (!provider) {
        return { skipped: true as const, reason: "provider_missing" };
      }

      const svcLabel =
        extracted.subcategoryLabel ??
        (extracted.category ? extracted.category.replace(/_/g, " ") : "Service request");

      const locationFinal =
        extracted.locationText?.trim() ||
        (payload.groupName ? payload.groupName.trim() : "") ||
        "Nigeria";

      const scoring = scoreServiceLeadHeuristic({
        message: text,
        serviceRequested: svcLabel,
        budgetKobo: extracted.budgetKobo,
        timeline: extracted.timeline,
        location: locationFinal,
        source: ServiceLeadSource.whatsapp,
        clientPhone: normalizedPhone,
        clientEmail: null,
      });

      await prisma.$transaction(async (tx) => {
        await tx.serviceLead.create({
          data: {
            serviceProviderId: provider.id,
            clientUserId: null,
            clientName: payload.senderName?.trim() || "WhatsApp contact",
            clientPhone: normalizedPhone,
            clientEmail: null,
            source: ServiceLeadSource.whatsapp,
            listingId: null,
            projectId: null,
            bundleId: null,
            serviceRequested: svcLabel.slice(0, 500),
            message: text.slice(0, 8000),
            budget: extracted.budgetKobo && extracted.budgetKobo > 0n ? extracted.budgetKobo : null,
            timeline: extracted.timeline,
            location: locationFinal.slice(0, 500),
            aiScore: scoring.aiScore,
            aiSummary: scoring.aiSummary.slice(0, 2000),
          },
        });

        await tx.serviceProvider.update({
          where: { id: provider.id },
          data: { leadCount: { increment: 1 } },
        });

        await tx.notification.create({
          data: {
            userId: provider.userId,
            type: NotificationType.system,
            title: "New WhatsApp ServiceHub lead",
            body: `${svcLabel} — auto-imported (confidence ${extracted.confidence}).`,
            metadata: {
              whatsappMessageId: payload.messageId,
              groupId: payload.groupId,
            } as object,
          },
        });

        await tx.providerWhatsAppConnection.update({
          where: { id: conn.id },
          data: { extractedLeadsCount: { increment: 1 } },
        });
      });

      console.log(
        `[${QUEUE_SERVICEHUB_WHATSAPP_LEAD}] imported lead for provider`,
        conn.serviceProviderId,
        payload.messageId,
      );

      return { imported: true as const };
    },
    { connection, concurrency: 1 },
  );

  worker.on("completed", (j) => {
    console.log(`[${QUEUE_SERVICEHUB_WHATSAPP_LEAD}] completed`, j.id);
  });

  attachDeadLetterHandler(
    connection,
    QUEUE_SERVICEHUB_WHATSAPP_LEAD,
    DLQ_SERVICEHUB_WHATSAPP_LEAD,
    worker,
  );

  return worker;
}
