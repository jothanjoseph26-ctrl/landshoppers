import { describe, expect, it } from "vitest";

import { ServiceLeadSource } from "@landshoppers/db";

import { extractServiceRequestFromText } from "./service-request-extract.js";
import {
  extractBudgetKoboFromText,
  scoreServiceLeadHeuristic,
} from "./lead-scoring.js";

describe("scoreServiceLeadHeuristic", () => {
  it("scores a rich listing-page quote strongly", () => {
    const r = scoreServiceLeadHeuristic({
      message:
        "Need title perfection for a plot in Lekki Phase 1, Lagos. Budget ₦2.5m. ASAP — survey done.",
      serviceRequested: "Title perfection",
      budgetKobo: 250_000_000n,
      timeline: "ASAP",
      location: "Lekki Phase 1, Lagos",
      source: ServiceLeadSource.listing_page,
      clientPhone: "+2348012345678",
      clientEmail: "ada@example.com",
    });
    expect(r.aiScore).toBeGreaterThanOrEqual(85);
    expect(r.aiSummary.length).toBeGreaterThan(5);
  });

  it("scores vague directory enquiries lower", () => {
    const r = scoreServiceLeadHeuristic({
      message: "I might need help sometime.",
      serviceRequested: "stuff",
      budgetKobo: null,
      timeline: null,
      location: "",
      source: ServiceLeadSource.directory,
      clientPhone: "bad",
      clientEmail: null,
    });
    expect(r.aiScore).toBeLessThan(40);
  });
});

describe("extractBudgetKoboFromText", () => {
  it("parses naira amounts", () => {
    expect(extractBudgetKoboFromText("Around ₦1.2m for survey")).toBe(120_000_000n);
  });
});

describe("extractServiceRequestFromText", () => {
  it("extracts category + confidence for obvious requests", () => {
    const r = extractServiceRequestFromText(
      "Hi — need a boundary survey in VI, Lagos within this week. Budget ₦800k.",
    );
    expect(r.isServiceRequest).toBe(true);
    expect(r.confidence).toBeGreaterThanOrEqual(0.6);
    expect(r.category).toBeTruthy();
  });

  it("flags casual chatter below auto-import confidence", () => {
    const r = extractServiceRequestFromText("Good morning everyone 👋");
    expect(r.confidence).toBeLessThan(0.6);
  });
});
