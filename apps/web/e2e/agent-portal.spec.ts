import { test, expect } from "@playwright/test"

/**
 * Agent Command Center smoke: UI loads with mocked `/v1/agent/*` (no live API required).
 * Run from `apps/web`: `npm run test:e2e -- e2e/agent-portal.spec.ts`
 */
test.describe("@smoke agent portal", () => {
  test("command center loads without console errors", async ({ page }) => {
    const consoleErrors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text())
    })

    await page.addInitScript(() => {
      sessionStorage.setItem("ls_access_token", "playwright-agent-portal-smoke")
    })

    await page.route("**/v1/agent/**", async (route) => {
      if (route.request().method() === "OPTIONS") {
        await route.fulfill({ status: 204, headers: corsHeaders })
        return
      }
      const url = route.request().url()
      if (url.includes("/v1/agent/context")) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, "content-type": "application/json" },
          body: JSON.stringify({
            data: {
              persona: "agent",
              userId: "00000000-0000-0000-0000-000000000001",
              email: "agent-smoke@example.test",
              displayName: "Smoke Agent",
              agencyName: "Smoke Realty",
              city: "Lagos",
              state: "Lagos",
              avatarUrl: null,
              tier: "free",
              subscriptionPlan: null,
              subscriptionStatus: null,
              rating: 0,
              reviewCount: 0,
              verification: {
                emailVerified: true,
                phoneVerified: false,
                bvnOnFile: false,
                agentVerifiedBadge: false,
                kycStatus: "pending",
              },
              paystackConfigured: false,
              featureFlags: {
                agentWhatsappEnabled: false,
                agentAiInsightsEnabled: true,
              },
            },
          }),
        })
        return
      }
      if (url.includes("/v1/agent/dashboard")) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, "content-type": "application/json" },
          body: JSON.stringify({
            data: {
              tier: "free",
              limits: {
                maxActiveListings: 5,
                maxLeadsPerMonth: 10,
                maxAiDescriptionGenerationsPerDay: 3,
                maxWhatsappConnections: 0,
              },
              usage: { activeListings: 0, inquiriesThisMonth: 0 },
              kpis: {
                activeListings: { value: 0, priorValue: null, changePercent: null },
                hotLeads: { count: 0, leadScoringAvailable: false },
                whatsappMessagesToday: { count: 0, bridgeConnected: false },
                viewsThisWeek: { value: 0, priorValue: 0, changePercent: null },
                conversionLast30d: { responded: 0, total: 0, ratePercent: null },
                estimatedMonthlyEarningsNgKobo: null,
                earningsAvailable: false,
              },
              upcomingTours: [],
            },
          }),
        })
        return
      }
      if (url.includes("/v1/agent/listings")) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, "content-type": "application/json" },
          body: JSON.stringify({
            data: [],
            meta: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
          }),
        })
        return
      }
      if (url.includes("/v1/agent/inquiries")) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, "content-type": "application/json" },
          body: JSON.stringify({
            data: [],
            meta: { page: 1, pageSize: 5, total: 0, totalPages: 0 },
          }),
        })
        return
      }
      await route.continue()
    })

    await page.goto("/agent")

    await expect(page.getByRole("heading", { name: /command center/i })).toBeVisible()
    await expect(page.getByText("Active listings").first()).toBeVisible()

    const benign = /ResizeObserver|hydration|Failed to load resource/i
    const serious = consoleErrors.filter((e) => !benign.test(e))
    expect(serious, serious.join("\n")).toEqual([])
  })
})

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
}
