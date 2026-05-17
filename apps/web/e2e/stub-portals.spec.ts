import { test, expect } from "@playwright/test"

/**
 * Smoke tests for stub-closure portal pages (mocked API — no live backend).
 * Run from apps/web: `npm run test:e2e -- e2e/stub-portals.spec.ts`
 */

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
}

async function fulfillOptions(route: {
  request: () => { method: () => string }
  fulfill: (o: object) => Promise<void>
}): Promise<boolean> {
  if (route.request().method() === "OPTIONS") {
    await route.fulfill({ status: 204, headers: corsHeaders })
    return true
  }
  return false
}

test.describe("@smoke stub-closure portals", () => {
  test("buyer settings and tours pages render", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("ls_access_token", "playwright-buyer-stub")
    })

    await page.route("**/v1/me/settings", async (route) => {
      if (await fulfillOptions(route)) return
      if (route.request().method() !== "GET") return route.continue()
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
        body: JSON.stringify({
          data: {
            email: "buyer@example.test",
            phone: "+2348012345678",
            profile: { firstName: "Ada", lastName: "Okafor", avatarUrl: null, city: "Lagos", state: "Lagos", country: "Nigeria" },
            notifications: { notifyEmail: true, notifySms: true, notifyPush: false },
            preferences: null,
          },
        }),
      })
    })

    await page.route("**/v1/me/tours**", async (route) => {
      if (await fulfillOptions(route)) return
      if (route.request().method() !== "GET") return route.continue()
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
        body: JSON.stringify({
          data: [],
          meta: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
        }),
      })
    })

    await page.goto("/buyer/settings")
    await expect(page.getByRole("heading", { name: /^settings$/i })).toBeVisible()
    await expect(page.getByLabel(/first name/i)).toHaveValue("Ada")

    await page.goto("/buyer/tours")
    await expect(page.getByRole("heading", { name: /^tours$/i })).toBeVisible()
    await expect(page.getByText(/no tour requests yet/i)).toBeVisible()
  })

  test("agent analytics and settings pages render", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("ls_access_token", "playwright-agent-stub")
    })

    await page.route("**/v1/agent/**", async (route) => {
      if (await fulfillOptions(route)) return
      const url = route.request().url()
      if (url.includes("/context")) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, "content-type": "application/json" },
          body: JSON.stringify({
            data: {
              persona: "agent",
              userId: "00000000-0000-0000-0000-000000000001",
              email: "agent@example.test",
              displayName: "Stub Agent",
              agencyName: "Stub Agency",
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
              featureFlags: { agentWhatsappEnabled: false, agentAiInsightsEnabled: true },
            },
          }),
        })
        return
      }
      if (url.includes("/analytics/summary")) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, "content-type": "application/json" },
          body: JSON.stringify({
            data: {
              period: "month",
              tier: "free",
              analyticsDepth: "basic",
              kpis: {
                views: { byDay: [], total: 0, changePercent: null },
                inquiries: { byDay: [], byStatus: {}, total: 0 },
                conversionRatePercent: null,
                topListings: [],
              },
            },
          }),
        })
        return
      }
      if (url.includes("/settings")) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, "content-type": "application/json" },
          body: JSON.stringify({
            data: {
              email: "agent@example.test",
              agencyName: "Stub Agency",
              licenseNumber: null,
              profile: { firstName: "Chidi", lastName: "Agent", city: "Lagos", state: "Lagos" },
              notifications: { notifyEmail: true, notifySms: true, notifyPush: false },
            },
          }),
        })
        return
      }
      await route.continue()
    })

    await page.goto("/agent/analytics")
    await expect(page.getByRole("heading", { name: /analytics/i })).toBeVisible()

    await page.goto("/agent/settings")
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible()
  })

  test("admin reports page renders export actions", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("ls_access_token", "playwright-admin-stub")
    })

    await page.goto("/admin/reports")
    await expect(page.getByRole("heading", { name: /reports/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /users export/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /listings export/i })).toBeVisible()
  })

  test("provider jobs page renders", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("ls_access_token", "playwright-provider-stub")
    })

    await page.route("**/v1/provider/**", async (route) => {
      if (await fulfillOptions(route)) return
      const url = route.request().url()
      if (url.includes("/context")) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, "content-type": "application/json" },
          body: JSON.stringify({
            data: {
              userId: "00000000-0000-0000-0000-000000000099",
              email: "provider@example.test",
              displayName: "Provider",
              businessName: "Stub Legal",
              category: "legal",
              city: "Lagos",
              state: "Lagos",
              logoUrl: null,
              avatarUrl: null,
              tier: "free",
              verificationLevel: "basic",
              isVerified: false,
              featureFlags: { providerWhatsappEnabled: false },
            },
          }),
        })
        return
      }
      if (url.includes("/jobs")) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, "content-type": "application/json" },
          body: JSON.stringify({
            data: [],
            meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
          }),
        })
        return
      }
      await route.continue()
    })

    await page.goto("/provider/jobs")
    await expect(page.getByRole("heading", { name: /jobs/i })).toBeVisible()
  })
})
