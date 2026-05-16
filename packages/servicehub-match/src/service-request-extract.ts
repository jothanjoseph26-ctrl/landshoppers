import { ServiceCategory } from "@landshoppers/db";

import { extractBudgetKoboFromText, looksLikeServiceLeadIntent } from "./lead-scoring.js";

export type ServiceRequestExtractResult = {
  isServiceRequest: boolean;
  confidence: number;
  category: ServiceCategory | null;
  subcategoryLabel: string | null;
  locationText: string | null;
  budgetKobo: bigint | null;
  timeline: string | null;
};

type CatRule = { cat: ServiceCategory; rx: RegExp };

const CATEGORY_RULES: CatRule[] = [
  { cat: ServiceCategory.legal, rx: /\b(lawyer|legal|title|deed|probate|consent|contract\s+review)\b/i },
  { cat: ServiceCategory.survey, rx: /\b(survey(or|ing)?|boundary|topographic|GIS)\b/i },
  { cat: ServiceCategory.architecture, rx: /\b(architect|structural|MEP|design\s+firm)\b/i },
  { cat: ServiceCategory.valuation, rx: /\b(valuation|valuer|appraisal)\b/i },
  { cat: ServiceCategory.mortgage, rx: /\b(mortgage|NHF|refinanc)\b/i },
  { cat: ServiceCategory.insurance, rx: /\b(insurance|coverage)\b/i },
  { cat: ServiceCategory.renovation, rx: /\b(renovat|contractor|tiling|plumbing|electrical)\b/i },
  { cat: ServiceCategory.photography, rx: /\b(photo|drone|virtual\s+tour|videograph)\b/i },
  { cat: ServiceCategory.property_management, rx: /\b(property\s+management|facility\s+management)\b/i },
  { cat: ServiceCategory.cleaning_moving, rx: /\b(cleaning|moving|fumigation)\b/i },
  { cat: ServiceCategory.home_technology, rx: /\b(CCTV|solar|smart\s+home|security\s+system)\b/i },
  { cat: ServiceCategory.inspection, rx: /\b(inspection|compliance|soil\s+test)\b/i },
];

function inferCategory(text: string): ServiceCategory | null {
  for (const r of CATEGORY_RULES) {
    if (r.rx.test(text)) return r.cat;
  }
  return null;
}

function inferSubcategory(text: string): string | null {
  const m =
    /\b(title\s+perfection|boundary\s+survey|virtual\s+tour|pre[-\s]?purchase\s+inspection)\b/i.exec(
      text,
    );
  return m ? m[1] : null;
}

function inferLocation(text: string): string | null {
  const inLoc = /\bin\s+([A-Za-z][A-Za-z\s,.]{4,80})/i.exec(text);
  if (inLoc) return inLoc[1].replace(/\s+/g, " ").trim();
  const comma = text.match(/([A-Za-z]{3,}\s*,\s*[A-Za-z]{3,})/);
  return comma ? comma[1].trim() : null;
}

function inferTimeline(text: string): string | null {
  const low = text.toLowerCase();
  if (/\basap|urgent|today|tomorrow|this\s+week\b/.test(low)) return "ASAP";
  if (/\b(next\s+month|within\s+a\s+month)\b/.test(low)) return "Within 1 month";
  if (/\bflexible\b/.test(low)) return "Flexible";
  return null;
}

/**
 * §6.3 heuristic extractor — deterministic MVP (<0.6 confidence → manual review / no auto-import).
 */
export function extractServiceRequestFromText(raw: string): ServiceRequestExtractResult {
  const text = raw.trim();
  const category = inferCategory(text);
  const budgetKobo = extractBudgetKoboFromText(text);
  const locationText = inferLocation(text);
  const timeline = inferTimeline(text);
  const sub = inferSubcategory(text);

  let confidence = 0.35;
  if (category) confidence += 0.22;
  if (looksLikeServiceLeadIntent(text)) confidence += 0.15;
  if (budgetKobo && budgetKobo > 0n) confidence += 0.12;
  if (locationText) confidence += 0.1;
  if (timeline) confidence += 0.08;
  confidence = Math.min(0.95, Math.round(confidence * 100) / 100);

  const isServiceRequest =
    confidence >= 0.55 &&
    (!!category || looksLikeServiceLeadIntent(text)) &&
    text.length >= 16;

  return {
    isServiceRequest,
    confidence,
    category,
    subcategoryLabel: sub,
    locationText,
    budgetKobo,
    timeline,
  };
}
