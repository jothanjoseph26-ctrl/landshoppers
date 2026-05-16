import type { ServiceLeadSource } from "@landshoppers/db";

export type LeadScoreInput = {
  message: string;
  serviceRequested: string;
  budgetKobo: bigint | null;
  timeline: string | null;
  location: string;
  source: ServiceLeadSource;
  clientPhone: string;
  clientEmail: string | null;
};

const VAGUE_BUDGET = /\b(reasonable|flexible|open[-\s]?ended|any\s+budget|not\s+sure)\b/i;

/** Loose ₦ / NGN / plain digits with k/m/million hints → kobo (best-effort). */
export function extractBudgetKoboFromText(text: string): bigint | null {
  const t = text.trim();
  if (!t || VAGUE_BUDGET.test(t)) return null;

  const compact = t.replace(/,/g, "");
  const cur =
    /(?:₦|NGN|naira)\s*([\d.]+)\s*(m|million|mm|k|thousand)?/i.exec(compact) ??
    /\b([\d.]+)\s*(?:₦|NGN)\b/i.exec(compact);
  if (!cur) {
    const plain = /\b([\d.]+)\s*(m|million|mm|k|thousand)\b/i.exec(compact);
    if (!plain) return null;
    const base = Number(plain[1]);
    if (!Number.isFinite(base)) return null;
    const mul =
      /^m|million|mm$/i.test(plain[2] ?? "") ? 1_000_000 : /^k|thousand$/i.test(plain[2] ?? "") ? 1000 : 1;
    const naira = base * mul;
    return BigInt(Math.round(Math.min(naira, Number.MAX_SAFE_INTEGER))) * 100n;
  }

  const base = Number(cur[1]);
  if (!Number.isFinite(base)) return null;
  const suf = (cur[2] ?? "").toLowerCase();
  const mul =
    suf === "m" || suf === "million" || suf === "mm"
      ? 1_000_000
      : suf === "k" || suf === "thousand"
        ? 1000
        : 1;
  const naira = base * mul;
  return BigInt(Math.round(Math.min(naira, Number.MAX_SAFE_INTEGER))) * 100n;
}

export function sourceQualityPoints(source: ServiceLeadSource): number {
  switch (source) {
    case "listing_page":
      return 15;
    case "bundle":
      return 12;
    case "whatsapp":
      return 10;
    case "directory":
      return 8;
    case "agent_referral":
      return 12;
    case "developer_rfq":
      return 13;
    case "post_purchase":
      return 14;
    default:
      return 6;
  }
}

const SPECIFIC_SERVICE_RX =
  /\b(title\s+perfection|deed\s+of\s+assignment|governor'?s?\s+consent|CAC\s+registration|boundary\s+survey|topographic|valuation\s+report|structural\s+integrity|pre[-\s]?purchase\s+inspection|virtual\s+tour|floor\s+plan|drone\s+footage)\b/i;

const CATEGORY_SERVICE_RX =
  /\b(lawyer|legal|survey(or|ing)?|architect|valuation|valuer|inspection|inspector|mortgage|renovat|photograph|property\s+management|insurance|cleaning|cctv|smart\s+home)\b/i;

const INTENT_RX =
  /\b(need(s)?|looking\s+for|want(s)?|please\s+quote|request(s)?|hire|book)\b.{0,80}\b(service|lawyer|survey|architect|valuation|inspection|quote)\b|\bquote\b|\bRFQ\b/i;

function budgetPoints(input: LeadScoreInput): number {
  if (input.budgetKobo !== null && input.budgetKobo > 0n) return 25;
  const fromMsg = extractBudgetKoboFromText(input.message);
  if (fromMsg !== null && fromMsg > 0n) return 25;
  if (VAGUE_BUDGET.test(input.message)) return 0;
  return 0;
}

function serviceSpecificityPoints(input: LeadScoreInput): number {
  const blob = `${input.serviceRequested}\n${input.message}`;
  if (SPECIFIC_SERVICE_RX.test(blob)) return 20;
  if (CATEGORY_SERVICE_RX.test(blob)) return 10;
  return 0;
}

function locationPrecisionPoints(location: string): number {
  const parts = location
    .split(/[,·|]/g)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return 15;
  if (parts.length === 1 && parts[0].length >= 4) return 8;
  if (parts.length === 1 && parts[0].length > 0) return 3;
  return 0;
}

function timelinePoints(input: LeadScoreInput): number {
  const blob = `${input.timeline ?? ""} ${input.message}`.toLowerCase();
  if (
    /\b(asap|urgent|today|tomorrow|immediate|now|this\s+week)\b/.test(blob) ||
    /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(blob)
  ) {
    return 15;
  }
  if (/\b(within\s+(a\s+)?month|next\s+month|30\s*days|few\s+weeks)\b/.test(blob)) return 8;
  return 0;
}

function completenessPoints(input: LeadScoreInput): number {
  let pts = 0;
  const digits = input.clientPhone.replace(/\D/g, "");
  if (digits.length >= 10) pts += 5;
  if (input.clientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.clientEmail)) pts += 5;
  return pts;
}

/** §6.2 deterministic lead score (0–100) + short summary for inbox sorting. */
export function scoreServiceLeadHeuristic(input: LeadScoreInput): {
  aiScore: number;
  aiSummary: string;
} {
  const pts =
    budgetPoints(input) +
    serviceSpecificityPoints(input) +
    locationPrecisionPoints(input.location) +
    timelinePoints(input) +
    completenessPoints(input) +
    sourceQualityPoints(input.source);

  const aiScore = Math.min(100, pts);

  const parts: string[] = [];
  if (budgetPoints(input) >= 25) parts.push("Budget stated");
  if (serviceSpecificityPoints(input) >= 20) parts.push("Specific service");
  else if (serviceSpecificityPoints(input) >= 10) parts.push("Category clear");
  if (locationPrecisionPoints(input.location) >= 15) parts.push("Location precise");
  if (timelinePoints(input) >= 15) parts.push("Urgent timeline");
  parts.push(`Score ${Math.round(aiScore)}`);

  return {
    aiScore,
    aiSummary: parts.slice(0, 4).join(" · "),
  };
}

/** Useful when WhatsApp text alone must qualify as a service enquiry (§6.3 gate before import). */
export function looksLikeServiceLeadIntent(text: string): boolean {
  const t = text.trim();
  if (t.length < 12) return false;
  return INTENT_RX.test(t) || (CATEGORY_SERVICE_RX.test(t) && /\b(need|want|looking|help|quote)\b/i.test(t));
}
