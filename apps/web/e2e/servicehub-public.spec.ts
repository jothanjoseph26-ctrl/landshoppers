import { test, expect } from "@playwright/test"

/**
 * ServiceHub public marketplace smoke (B6).
 * Run: `npm run test:e2e -- e2e/servicehub-public.spec.ts` from `apps/web`
 */
test.describe("@smoke ServiceHub public (/services)", () => {
  test("homepage hero and category navigation", async ({ page }) => {
    await page.goto("/services")
    await expect(
      page.getByRole("heading", { level: 1 }).filter({ hasText: /trusted network|real estate service/i }),
    ).toBeVisible()

    const legalLink = page.getByRole("link", { name: /legal/i }).first()
    await legalLink.click()
    await expect(page).toHaveURL(/\/services\/legal/)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("bundles page loads", async ({ page }) => {
    await page.goto("/services/bundles")
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/bundle/i)
    await expect(page.getByRole("link", { name: /custom bundle/i })).toBeVisible()
  })

  test("custom bundle builder route loads", async ({ page }) => {
    await page.goto("/services/bundles/build")
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/custom bundle/i)
  })
})
