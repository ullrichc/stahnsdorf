import { expect, test } from '@playwright/test';
import {
  seedTestCollections,
  seedTestPOIs,
  setupTestEnvironment,
  TEST_EDITOR_EMAIL,
} from '../utils/firebase-test-utils';

const POIS = [
  {
    id: 'poi_sws_mit-gps',
    typ: 'grab',
    name: { de: 'Person mit GPS' },
    kurztext: { de: 'Prägnanter Kurztext.' },
    beschreibung: { de: 'Eine vollständige Beschreibung für den Eintrag.' },
    koordinaten: { lat: 52.3895, lng: 13.181 },
    lagehinweis: 'Alte Umbettung, Feld 1',
    datum_von: '1873',
    datum_bis: '1923-01-31',
    wikipedia_url: null,
    bilder: [],
    audio: {},
    quellen: [],
    status: 'bestätigt',
    publish_status: 'veröffentlicht',
  },
  {
    id: 'poi_sws_ohne-gps',
    typ: 'denkmal',
    name: { de: 'Denkmal ohne GPS' },
    kurztext: { de: 'Noch nicht auf der Karte verortet.' },
    beschreibung: { de: 'Dieser Eintrag gehört trotzdem vollständig zur Sammlung.' },
    koordinaten: null,
    datum_von: null,
    datum_bis: null,
    wikipedia_url: null,
    bilder: [],
    audio: {},
    quellen: [],
    status: 'bestätigt',
    publish_status: 'veröffentlicht',
  },
  {
    id: 'poi_sws_zweiter-mit-gps',
    typ: 'bauwerk',
    name: { de: 'Zweiter Ort mit GPS' },
    kurztext: { de: 'Ein zweiter sichtbarer Ort.' },
    beschreibung: { de: 'Dieser Ort prüft den Fokus innerhalb einer Sammlung.' },
    koordinaten: { lat: 52.386, lng: 13.181 },
    datum_von: '1911',
    datum_bis: null,
    wikipedia_url: null,
    bilder: [],
    audio: {},
    quellen: [],
    status: 'bestätigt',
    publish_status: 'veröffentlicht',
  },
  {
    id: 'poi_sws_entwurf-mit-gps',
    typ: 'denkmal',
    name: { de: 'Unveröffentlichter Ort' },
    kurztext: { de: 'Darf nicht sichtbar sein.' },
    beschreibung: { de: 'Dieser Entwurf besitzt GPS, ist aber nicht veröffentlicht.' },
    koordinaten: { lat: 52.388, lng: 13.182 },
    datum_von: null,
    datum_bis: null,
    wikipedia_url: null,
    bilder: [],
    audio: {},
    quellen: [],
    status: 'prüfen',
    publish_status: 'entwurf',
  },
];

const COLLECTION = {
  id: 'collection_sws_besucher-test',
  name: { de: 'Besucher-Test' },
  kurztext: { de: 'Zwei ausgewählte Orte.' },
  beschreibung: { de: 'Die vollständige Sammlungsbeschreibung bleibt auf der Detailseite sichtbar.' },
  pois: POIS.map((poi) => poi.id),
  status: 'bestätigt',
  publish_status: 'veröffentlicht',
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('locale', 'de'));
  await setupTestEnvironment(TEST_EDITOR_EMAIL);
  await seedTestPOIs(POIS, TEST_EDITOR_EMAIL);
  await seedTestCollections([COLLECTION], TEST_EDITOR_EMAIL);
});

test('map uses SVG markers, a collapsed search, and opens a focused POI', async ({ page }) => {
  await page.goto('/?poi=poi_sws_mit-gps');

  await expect(page.getByRole('button', { name: 'Namen suchen...' })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('[data-map-overlay-state="loaded"]')).toHaveCount(1);
  await expect(page.locator('.custom-marker svg')).toHaveCount(2);
  await expect(page.locator('.marker-wrapper--selected')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Person mit GPS' })).toBeVisible();
  expect(await page.locator('.poi-tooltip').evaluateAll((tooltips) =>
    tooltips.filter((tooltip) => getComputedStyle(tooltip).opacity !== '0').length,
  )).toBe(2);

  const attributionBox = await page.locator('.leaflet-control-attribution').boundingBox();
  const cardBox = await page.getByTestId('poi-card').boundingBox();
  expect(attributionBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  expect(attributionBox!.y + attributionBox!.height).toBeLessThanOrEqual(cardBox!.y);
});

test('labeled map controls and markers do not overlap on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.addInitScript(() => window.sessionStorage.setItem('stahnsdorf.mapView', JSON.stringify({
    lat: 52.3895066,
    lng: 13.1809545,
    zoom: 18,
  })));
  await page.goto('/');

  const labeledMarker = page.locator('.marker-container').first();
  await expect(labeledMarker).toBeVisible();
  expect((await labeledMarker.boundingBox())!.width).toBe(48);
  expect(await page.locator('.poi-tooltip').evaluateAll((tooltips) =>
    tooltips.filter((tooltip) => getComputedStyle(tooltip).opacity !== '0').length,
  )).toBe(2);

  await page.getByRole('button', { name: 'Namen suchen...' }).click();
  await page.getByPlaceholder('Namen suchen...').fill('Person');
  await expect(page.getByRole('button', { name: 'Person mit GPS' })).toBeVisible();
  const searchBox = await page.getByTestId('search-panel').boundingBox();
  const locateBox = await page.getByTestId('locate-button').boundingBox();
  const attributionBox = await page.locator('.leaflet-control-attribution').boundingBox();
  expect(searchBox).not.toBeNull();
  expect(locateBox).not.toBeNull();
  expect(attributionBox).not.toBeNull();
  expect(searchBox!.x + searchBox!.width).toBeLessThanOrEqual(locateBox!.x - 8);
  expect(searchBox!.y + searchBox!.height).toBeLessThanOrEqual(attributionBox!.y);
});

test('map markers remain usable when the local overlay cannot be loaded', async ({ page }) => {
  await page.route('**/map-overlay.geojson', (route) => route.fulfill({ status: 404, body: 'missing' }));
  await page.goto('/');

  await expect(page.locator('[data-map-overlay-state="error"]')).toHaveCount(1);
  await page.locator('.marker-container').filter({
    has: page.locator('[data-poi-id="poi_sws_mit-gps"]'),
  }).click();
  await expect(page.getByRole('heading', { name: 'Person mit GPS' })).toBeVisible();
});

test('POI details provide semantic dates, map focus, and active map navigation', async ({ page }) => {
  await page.goto('/poi?id=poi_sws_mit-gps');

  await expect(page.getByText('1873 bis 31.01.1923')).toBeVisible();
  const feedbackLine = page.locator('p', {
    hasText: 'Fehlt eine Information oder ist eine Angabe nicht korrekt?',
  });
  await expect(feedbackLine.getByRole('link', { name: 'Hinweis zu diesem Eintrag geben' })).toBeVisible();
  const mapLink = page.getByRole('link', { name: 'Auf der Karte zeigen' });
  await expect(mapLink).toHaveAttribute('href', '/?poi=poi_sws_mit-gps');
  await expect(page.getByRole('link', { name: 'Karte', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('POI back navigation keeps internal context and uses a safe direct-entry fallback', async ({ page }) => {
  await page.goto('/poi?id=poi_sws_mit-gps');
  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/sammlung?id=collection_sws_besucher-test');
  await page.getByRole('link', { name: /Person mit GPS/ }).click();
  await expect(page).toHaveURL(/\/poi\?id=poi_sws_mit-gps/);
  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(page).toHaveURL('/sammlung?id=collection_sws_besucher-test');
});

test('collections do not request location and list only POIs with coordinates', async ({ context, page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition: () => {
          ;(window as typeof window & { __watchPositionCalls?: number }).__watchPositionCalls =
            ((window as typeof window & { __watchPositionCalls?: number }).__watchPositionCalls ?? 0) + 1;
          return 1;
        },
        clearWatch: () => undefined,
      },
    });
  });
  await context.clearPermissions();
  await page.goto('/sammlungen');

  await expect(page.getByText('Standort konnte nicht ermittelt werden.')).toHaveCount(0);
  expect(await page.evaluate(() =>
    (window as typeof window & { __watchPositionCalls?: number }).__watchPositionCalls ?? 0,
  )).toBe(0);
  const collectionLink = page.getByRole('link', { name: /Besucher-Test/ });
  await expect(collectionLink).toContainText('2 Orte');
  await collectionLink.click();

  await expect(page.locator('[data-map-overlay-state="loaded"]')).toHaveCount(1);
  await expect(page.getByText(COLLECTION.beschreibung.de)).toBeVisible();
  await expect(page.getByRole('link', { name: /Person mit GPS/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Zweiter Ort mit GPS/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Denkmal ohne GPS/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Unveröffentlichter Ort/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Sammlungen' })).toHaveAttribute('aria-current', 'page');

  await page.locator('.marker-container').filter({
    has: page.locator('[data-poi-id="poi_sws_zweiter-mit-gps"]'),
  }).click();
  await expect(page.getByRole('heading', { name: 'Zweiter Ort mit GPS' })).toBeVisible();
  const selectedBox = await page.locator('.marker-wrapper--selected').boundingBox();
  const cardBox = await page.getByTestId('poi-card').boundingBox();
  expect(selectedBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  expect(selectedBox!.y + selectedBox!.height).toBeLessThanOrEqual(cardBox!.y);
});
