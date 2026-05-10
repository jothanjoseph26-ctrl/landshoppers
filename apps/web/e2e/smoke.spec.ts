import { test, expect } from '@playwright/test'

/** Public discovery smoke - keep narrow so it stays stable as dashboard UIs evolve. */
test.describe('@smoke navigation', () => {
  test('home loads', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { level: 1, name: /dream property/i }),
    ).toBeVisible()
  })

  test('listings discovery loads', async ({ page }) => {
    await page.goto('/listings')
    await expect(
      page.getByRole('heading', { level: 1, name: /property listings/i }),
    ).toBeVisible()
  })

  test('map-search redirects to split listings', async ({ page }) => {
    await page.goto('/map-search')
    await expect(page).toHaveURL(/\/listings\?.*view=split/)
  })

  test('developers directory loads', async ({ page }) => {
    await page.goto('/developers')
    await expect(
      page.getByRole('heading', { level: 1, name: /developers/i }),
    ).toBeVisible()
  })

  for (const role of ['buyer', 'agent', 'developer'] as const) {
    test(`${role} signup redirects to role dashboard`, async ({ page }) => {
      await page.route('**/v1/auth/register', async (route) => {
        if (route.request().method() === 'OPTIONS') {
          await route.fulfill({ status: 204, headers: corsHeaders })
          return
        }
        await route.fulfill({
          status: 201,
          headers: { ...corsHeaders, 'content-type': 'application/json' },
          body: JSON.stringify({
            data: {
              accessToken: `test-${role}-access`,
              refreshToken: `test-${role}-refresh`,
              user: {
                id: `test-${role}`,
                email: `${role}@example.com`,
                role,
              },
            },
          }),
        })
      })

      await page.goto('/register')
      await page.getByRole('button', { name: roleNames[role] }).click()
      await expect(
        page.getByRole('heading', { name: new RegExp(`create ${role} account`, 'i') }),
      ).toBeVisible()
      await page.locator('#firstName').fill('Smoke')
      await page.locator('#lastName').fill('User')
      await page.locator('#email').fill(`${role}-${Date.now()}@example.com`)
      await page.locator('#phone').fill('+2348012345678')
      if (role === 'developer') {
        await page.locator('#companyName').fill('Smoke Developments')
      }
      await page.locator('#password').fill('Password123!')
      await page.locator('#confirmPassword').fill('Password123!')
      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page).toHaveURL(new RegExp(`/${role}$`))
    })
  }

  test('admin login redirects to admin dashboard', async ({ page }) => {
    await page.route('**/v1/auth/login', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders })
        return
      }
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
        body: JSON.stringify({
          data: {
            accessToken: 'test-admin-access',
            refreshToken: 'test-admin-refresh',
            user: {
              id: 'test-admin',
              email: 'admin@example.com',
              role: 'admin',
            },
          },
        }),
      })
    })

    await page.goto('/login')
    await page.locator('#email').fill('admin@example.com')
    await page.locator('#password').fill('Password123!')
    await page.locator('form').getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/admin$/)
  })
})

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type,authorization',
}

const roleNames = {
  buyer: /buyer find your dream property/i,
  agent: /agent list and sell properties/i,
  developer: /developer showcase your projects/i,
}
