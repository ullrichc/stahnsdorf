import { expect, test } from '@playwright/test'

test('map and bottom navigation fit into the mobile visual viewport without page scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.addInitScript(() => window.localStorage.setItem('locale', 'de'))
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Eigenen Standort anzeigen' })).toBeVisible()

  const layout = await page.evaluate(() => {
    const nav = document.querySelector('nav')?.getBoundingClientRect()
    return {
      viewportHeight: window.innerHeight,
      pageHeight: document.documentElement.scrollHeight,
      navBottom: nav?.bottom ?? 0,
    }
  })

  expect(layout.pageHeight).toBeLessThanOrEqual(layout.viewportHeight + 1)
  expect(layout.navBottom).toBeCloseTo(layout.viewportHeight, 0)
})

test('location error stops tracking and leaves the locate button ready to retry', async ({ page, context }) => {
  await context.clearPermissions()
  await page.addInitScript(() => window.localStorage.setItem('locale', 'de'))
  await page.goto('/')

  const locateButton = page.getByRole('button', { name: 'Eigenen Standort anzeigen' })
  await expect(locateButton).toBeVisible()
  await locateButton.click()

  await expect(page.getByRole('status')).toContainText('Standort konnte nicht ermittelt werden.')
  await expect(locateButton).toHaveAttribute('aria-pressed', 'false')
})
