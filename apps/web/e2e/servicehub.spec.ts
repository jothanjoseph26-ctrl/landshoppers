import { test, expect } from "@playwright/test"

/**
 * ServiceHub public marketplace + provider OS smoke (mocked API for dashboard).
 * Run: `npm run test:e2e -- e2e/servicehub.spec.ts` from `apps/web`
 */
test.describe("@smoke ServiceHub (/services + /provider)", () => {
  test("services directory home renders hero", async ({ page }) => {
    await page.goto("/services")
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .filter({ hasText: /trusted network|Find Trusted|real estate service/i }),
    ).toBeVisible()
  })

  test("provider portal shell renders (auth token stub)", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("ls_access_token", "playwright-servicehub-provider")
    })

    await page.goto("/provider")

    await expect(page.getByRole("heading", { name: /Provider Portal/i })).toBeVisible()
    await expect(page.getByRole("navigation").getByRole("link", { name: "Dashboard" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Lead inbox" })).toBeVisible()
  })
})
