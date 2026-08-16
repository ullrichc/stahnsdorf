import { expect, test } from '@playwright/test'

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
