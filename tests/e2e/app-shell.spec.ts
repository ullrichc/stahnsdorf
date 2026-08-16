import { expect, test } from '@playwright/test'
import {
  seedTestCollections,
  seedTestPOIs,
  setupTestEnvironment,
  TEST_EDITOR_EMAIL,
} from '../utils/firebase-test-utils'

const DETAIL_POI = {
  id: 'poi_sws_shell-test',
  typ: 'grab',
  name: { de: 'Shell Test' },
  kurztext: { de: 'Testeintrag' },
  beschreibung: { de: 'Testbeschreibung' },
  koordinaten: null,
  datum_von: null,
  datum_bis: null,
  wikipedia_url: null,
  bilder: [],
  audio: {},
  quellen: [],
  status: 'bestätigt',
  notiz: '',
  publish_status: 'veröffentlicht',
}

const DETAIL_COLLECTION = {
  id: 'collection_sws_shell-test',
  name: { de: 'Shell Sammlung' },
  kurztext: { de: 'Testsammlung' },
  beschreibung: { de: 'Testbeschreibung' },
  pois: [],
  status: 'bestätigt',
  notiz: '',
  publish_status: 'veröffentlicht',
}

test.beforeEach(async ({ page }) => {
  await setupTestEnvironment(TEST_EDITOR_EMAIL)
  await seedTestPOIs([DETAIL_POI], TEST_EDITOR_EMAIL)
  await seedTestCollections([DETAIL_COLLECTION], TEST_EDITOR_EMAIL)
  await page.setViewportSize({ width: 360, height: 640 })
  await page.addInitScript(() => window.localStorage.setItem('locale', 'de'))
})

const visitorRoutes = [
  { path: '/info', visibleText: 'Information' },
  { path: '/sammlungen', visibleText: 'Sammlungen' },
  { path: '/sammlung?id=collection_sws_shell-test', visibleText: 'Shell Sammlung' },
  { path: '/einstellungen', visibleText: 'Optionen' },
  { path: '/poi?id=poi_sws_shell-test', visibleText: 'Shell Test' },
]

for (const route of visitorRoutes) {
  test(`${route.path} scrolls inside the app shell without bottom-nav overlap`, async ({ page }) => {
    await page.goto(route.path)
    await expect(page.getByText(route.visibleText, { exact: true }).first()).toBeVisible()

    const layout = await page.evaluate(() => {
      const main = document.querySelector('body > main')?.getBoundingClientRect()
        ?? document.querySelector('main')?.getBoundingClientRect()
      const nav = document.querySelector('body > nav')?.getBoundingClientRect()
        ?? document.querySelector('nav')?.getBoundingClientRect()
      return {
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        mainBottom: main?.bottom ?? 0,
        navTop: nav?.top ?? 0,
        navBottom: nav?.bottom ?? 0,
      }
    })

    expect(layout.documentHeight).toBeLessThanOrEqual(layout.viewportHeight + 1)
    expect(layout.mainBottom).toBeCloseTo(layout.navTop, 0)
    expect(layout.navBottom).toBeCloseTo(layout.viewportHeight, 0)

    const scroll = await page.evaluate(() => {
      const main = document.querySelector('body > main') as HTMLElement | null
      const nav = document.querySelector('body > nav') as HTMLElement | null
      if (!main || !nav || main.scrollHeight <= main.clientHeight) {
        return null
      }

      const navTopBefore = nav.getBoundingClientRect().top
      main.scrollTo({ top: main.scrollHeight })
      return {
        scrollTop: main.scrollTop,
        navTopBefore,
        navTopAfter: nav.getBoundingClientRect().top,
      }
    })

    if (scroll) {
      expect(scroll.scrollTop).toBeGreaterThan(0)
      expect(scroll.navTopAfter).toBeCloseTo(scroll.navTopBefore, 0)
    }
  })
}
