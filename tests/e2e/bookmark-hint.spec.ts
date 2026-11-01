import { expect, test, Page } from '@playwright/test'
import { seedTestCollections, seedTestPOIs, setupTestEnvironment, TEST_EDITOR_EMAIL } from '../utils/firebase-test-utils'

const androidChrome = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'

async function mobile(page: Page, options: { blocked?: boolean; locale?: string; ua?: string; standalone?: boolean } = {}) {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(({ ua, blocked, locale, standalone }) => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => ua })
    Object.defineProperty(navigator, 'userAgentData', { configurable: true, get: () => undefined })
    Object.defineProperty(navigator, 'platform', { configurable: true, get: () => ua.includes('Android') ? 'Linux armv8l' : 'iPhone' })
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, get: () => 5 })
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'de-DE' })
    Object.defineProperty(navigator, 'standalone', { configurable: true, get: () => standalone })
    if (blocked) {
      Object.defineProperty(window, 'localStorage', { get: () => { throw new DOMException('Blocked', 'SecurityError') } })
      Object.defineProperty(window, 'sessionStorage', { get: () => { throw new DOMException('Blocked', 'SecurityError') } })
    } else localStorage.setItem('locale', locale)
  }, { ua: options.ua ?? androidChrome, blocked: options.blocked ?? false, locale: options.locale ?? 'de', standalone: options.standalone ?? false })
}

test('first mobile visit shows help automatically selected for Chrome and closes permanently', async ({ page }) => {
  await mobile(page)
  await page.goto('/info')
  const hint = page.getByTestId('bookmark-hint')
  await expect(hint).toBeVisible()
  await hint.getByRole('button', { name: 'So geht’s', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading')).toContainText('Chrome')
  expect(await dialog.locator('ol li').count()).toBeGreaterThan(0)
  expect(await dialog.locator('ol li').count()).toBeLessThanOrEqual(3)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(hint).toBeVisible()
  await hint.getByRole('button', { name: 'Schließen', exact: true }).click()
  await page.reload()
  await expect(hint).toHaveCount(0)
  await page.getByRole('button', { name: 'Seite als Lesezeichen speichern' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('blocked browser storage does not prevent language initialization or closing', async ({ page }) => {
  await mobile(page, { blocked: true })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/info')
  await expect(page.getByTestId('bookmark-hint')).toBeVisible()
  await page.getByTestId('bookmark-hint').getByRole('button', { name: 'Schließen', exact: true }).click()
  await page.getByRole('link', { name: 'Optionen' }).click()
  await expect(page.getByTestId('bookmark-hint')).toHaveCount(0)
  expect(errors.filter(message => /Blocked|SecurityError|hydration/i.test(message))).toEqual([])
})

test('stored English is used on the first visible hint', async ({ page }) => {
  await mobile(page, { locale: 'en' })
  await page.goto('/info')
  await expect(page.getByTestId('bookmark-hint')).toContainText('Close')
  await expect(page.getByTestId('bookmark-hint')).not.toContainText('Schließen')
})

test('help closes on navigation and 404 never displays a hint', async ({ page }) => {
  await mobile(page)
  await page.goto('/info')
  await page.getByTestId('bookmark-hint').getByRole('button', { name: 'So geht’s', exact: true }).click()
  await page.goto('/admin')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByTestId('bookmark-hint')).toHaveCount(0)
  await page.goto('/not-a-real-page')
  await expect(page.getByTestId('bookmark-hint')).toHaveCount(0)
})

test('desktop and standalone do not get an automatic prompt', async ({ page }) => {
  await page.goto('/info')
  await expect(page.getByTestId('bookmark-hint')).toHaveCount(0)
  await mobile(page, { standalone: true })
  await page.reload()
  await expect(page.getByTestId('bookmark-hint')).toHaveCount(0)
})

test('manual help has an inert background without native showModal support', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('locale', 'de'))
  await page.addInitScript(() => { Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { value: undefined }) })
  await page.goto('/info')
  await page.getByRole('button', { name: 'Seite als Lesezeichen speichern' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.locator('main').evaluate(element => (element as HTMLElement).inert)).toBe(true)
  await page.getByRole('dialog').getByRole('button', { name: 'Schließen', exact: true }).first().click()
  expect(await page.locator('main').evaluate(element => (element as HTMLElement).inert)).toBe(false)
})

test('closing in another tab releases an open help dialog', async ({ page, context }) => {
  await mobile(page)
  await page.goto('/info')
  await page.getByTestId('bookmark-hint').getByRole('button', { name: 'So geht’s', exact: true }).click()
  const other = await context.newPage()
  await other.goto('/info')
  await other.evaluate(() => localStorage.setItem('swk::bookmark-hint:v1', '1'))
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Seite als Lesezeichen speichern' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await other.close()
})

test('banner reserves layout space in narrow landscape with large text', async ({ page }) => {
  await mobile(page)
  await page.setViewportSize({ width: 568, height: 320 })
  await page.goto('/info')
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  await expect(page.getByTestId('bookmark-hint')).toBeVisible()
  const layout = await page.evaluate(() => {
    const main = document.querySelector('main')!.getBoundingClientRect()
    const hint = document.querySelector('[data-testid="bookmark-hint"]')!.getBoundingClientRect()
    const nav = document.querySelector('nav')!.getBoundingClientRect()
    return { mainBottom: main.bottom, hintTop: hint.top, hintBottom: hint.bottom, navTop: nav.top, width: document.documentElement.scrollWidth, viewport: innerWidth }
  })
  expect(layout.mainBottom).toBeLessThanOrEqual(layout.hintTop + 1)
  expect(layout.hintBottom).toBeLessThanOrEqual(layout.navTop + 1)
  expect(layout.width).toBeLessThanOrEqual(layout.viewport)
})

test('Safari is detected and an unknown browser can select another instruction', async ({ page }) => {
  await mobile(page, { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' })
  await page.goto('/info')
  await page.getByTestId('bookmark-hint').getByRole('button', { name: 'So geht’s', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('heading')).toContainText('Safari')
  await page.getByRole('button', { name: 'Andere Anleitung' }).click()
  await page.getByLabel('Browser', { exact: true }).selectOption('firefox')
  await expect(page.getByRole('dialog').getByRole('heading')).toContainText('Firefox')
  await page.keyboard.press('Escape')
  await page.getByTestId('bookmark-hint').getByRole('button', { name: 'So geht’s', exact: true }).click()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Andere Anleitung' })).toBeFocused()
})

test('map, direct POI and collection entries keep navigation and lightbox usable', async ({ page }) => {
  await setupTestEnvironment(TEST_EDITOR_EMAIL)
  await seedTestPOIs([{
    id: 'poi_sws_bookmark-test', typ: 'grab', name: { de: 'Bookmark Test' }, kurztext: { de: 'Test' }, beschreibung: { de: 'Beschreibung.' },
    koordinaten: { lat: 52.3895, lng: 13.181 }, datum_von: null, datum_bis: null,
    bilder: [{ datei: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a03sAAAAASUVORK5CYII=', nachweis: 'Test' }],
    audio: {}, quellen: [], status: 'bestätigt', publish_status: 'veröffentlicht',
  }], TEST_EDITOR_EMAIL)
  await seedTestCollections([{
    id: 'collection_sws_bookmark-test', name: { de: 'Bookmark Sammlung' }, kurztext: { de: 'Test' }, beschreibung: { de: 'Test.' },
    pois: ['poi_sws_bookmark-test'], status: 'bestätigt', publish_status: 'veröffentlicht',
  }], TEST_EDITOR_EMAIL)
  await mobile(page)
  await page.goto('/')
  const hint = page.getByTestId('bookmark-hint')
  await expect(hint).toBeVisible()
  await expect(page.locator('.leaflet-control-attribution')).toBeVisible()
  const mapBefore = await page.locator('.leaflet-container').boundingBox()
  const hintBox = await hint.boundingBox()
  expect(mapBefore!.y + mapBefore!.height).toBeLessThanOrEqual(hintBox!.y + 1)
  await page.screenshot({ path: 'outputs/bookmark-hint/mobile-map.png' })
  await page.goto('/sammlung?id=collection_sws_bookmark-test')
  await expect(page.getByRole('heading', { name: 'Bookmark Sammlung' })).toBeVisible()
  await expect(hint).toBeVisible()
  await page.goto('/poi?id=poi_sws_bookmark-test')
  await expect(page.getByRole('heading', { name: 'Bookmark Test' })).toBeVisible()
  await expect(hint).toBeVisible()
  await page.getByRole('button', { name: /Bookmark Test: / }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(hint).not.toBeVisible()
  await page.keyboard.press('Escape')
  await expect(hint).toBeVisible()
  await hint.getByRole('button', { name: 'So geht’s', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await page.screenshot({ path: 'outputs/bookmark-hint/mobile-help.png' })
})
