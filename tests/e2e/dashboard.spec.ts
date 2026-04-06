/**
 * E2E Tests: Dashboard & Table (TAB-01 to TAB-03, FIL-01 to FIL-03, SRT-01 to SRT-03)
 *
 * Run: npx playwright test tests/e2e/dashboard.spec.ts
 * (requires Firebase Emulator running: npm run emulators)
 */
import { test, expect } from '@playwright/test';
import {
  setupTestEnvironment,
  loginInPlaywright,
  seedTestPOIs,
  TEST_EDITOR_EMAIL,
} from '../utils/firebase-test-utils';

// Three diverse test POIs for filtering, sorting, and stats verification
const TEST_POIS = [
  {
    id: 'poi_sws_alice-meier',
    typ: 'grab',
    name: { de: 'Alice Meier' },
    kurztext: { de: 'Kurz A' },
    beschreibung: { de: 'Beschreibung A' },
    koordinaten: { lat: 52.39, lng: 13.19 },
    datum_von: '1850-03-01',
    datum_bis: '1920-07-15',
    wikipedia_url: null,
    bilder: [],
    audio: {},
    quellen: [],
    status: 'bestätigt',
    notiz: '',
    publish_status: 'veröffentlicht',
  },
  {
    id: 'poi_sws_berliner-dom',
    typ: 'bauwerk',
    name: { de: 'Berliner Dom' },
    kurztext: { de: 'Kurz B' },
    beschreibung: { de: 'Beschreibung B' },
    koordinaten: null,
    datum_von: null,
    datum_bis: null,
    wikipedia_url: null,
    bilder: [],
    audio: {},
    quellen: [],
    status: 'prüfen',
    notiz: '',
    publish_status: 'entwurf',
  },
  {
    id: 'poi_sws_carl-zille',
    typ: 'grab',
    name: { de: 'Carl Zille' },
    kurztext: { de: 'Kurz C' },
    beschreibung: { de: 'Beschreibung C' },
    koordinaten: { lat: 52.40, lng: 13.20 },
    datum_von: '1900-01-01',
    datum_bis: '1960-12-31',
    wikipedia_url: null,
    bilder: [],
    audio: {},
    quellen: [],
    status: 'bestätigt',
    notiz: '',
    publish_status: 'zur_prüfung',
  },
];

test.beforeEach(async () => {
  await setupTestEnvironment(TEST_EDITOR_EMAIL);
  await seedTestPOIs(TEST_POIS, TEST_EDITOR_EMAIL);
});

// Helper: login and wait for table
async function loginAndWaitForTable(page: any) {
  await page.goto('/admin');
  await loginInPlaywright(page, TEST_EDITOR_EMAIL);
  await page.locator('.admin-table').waitFor({ state: 'visible', timeout: 15_000 });
}

// ═══════════════════════════════════════════════════════════
// TAB-01: Tabelle lädt POIs + BUG-10 (Stats only show total)
// ═══════════════════════════════════════════════════════════
test('TAB-01: table loads POIs and stats card shows only total (BUG-10)', async ({ page }) => {
  await loginAndWaitForTable(page);

  // Table should show 3 rows
  const rows = page.locator('.admin-table tbody tr');
  await expect(rows).toHaveCount(3);

  // Stats card shows total count
  const statsValue = page.locator('.admin-stats-value');
  await expect(statsValue).toHaveText('3');

  // BUG-10: Stats card should render ONLY the total, not withCoords/zurPruefung/entwuerfe
  // Verify there's exactly one stats value displayed
  await expect(page.locator('.admin-stats-value')).toHaveCount(1);
  await expect(page.locator('.admin-stats-label')).toHaveText('Gesamt POIs');

  // Footer shows correct count
  await expect(page.locator('.admin-footer')).toContainText('Zeige 3 von 3 POIs');
});

// ═══════════════════════════════════════════════════════════
// TAB-02: Textsuche
// ═══════════════════════════════════════════════════════════
test('TAB-02: text search filters by name', async ({ page }) => {
  await loginAndWaitForTable(page);

  // Search for "Alice"
  await page.locator('.admin-search-input').fill('Alice');

  // Only Alice Meier should be visible
  const rows = page.locator('.admin-table tbody tr');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Alice Meier');

  // Clear search shows all again
  await page.locator('.admin-search-input').fill('');
  await expect(rows).toHaveCount(3);
});

// ═══════════════════════════════════════════════════════════
// TAB-03: "Neuer POI"-Button
// ═══════════════════════════════════════════════════════════
test('TAB-03: Neuer POI button navigates to /admin/poi/new', async ({ page }) => {
  await loginAndWaitForTable(page);

  await page.locator('a:has-text("Neuer POI")').click();
  await page.waitForURL('**/admin/poi/new');
  expect(page.url()).toContain('/admin/poi/new');
});

// ═══════════════════════════════════════════════════════════
// FIL-01: Filter nach Typ
// ═══════════════════════════════════════════════════════════
test('FIL-01: filter by type shows only matching POIs', async ({ page }) => {
  await loginAndWaitForTable(page);

  // Select type "grab" — 2 POIs are "grab" (Alice + Carl)
  const typSelect = page.locator('.admin-filter-group').filter({ hasText: 'Typ' }).locator('select');
  await typSelect.selectOption('grab');

  const rows = page.locator('.admin-table tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(page.locator('.admin-footer')).toContainText('Zeige 2 von 3 POIs');

  // Select type "bauwerk" — only Berliner Dom
  await typSelect.selectOption('bauwerk');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Berliner Dom');
});

// ═══════════════════════════════════════════════════════════
// FIL-02: Filter nach Publish-Status
// ═══════════════════════════════════════════════════════════
test('FIL-02: filter by publish status', async ({ page }) => {
  await loginAndWaitForTable(page);

  // Select "Entwurf" — only Berliner Dom
  const statusSelect = page.locator('.admin-filter-group').filter({ hasText: 'Status' }).locator('select');
  await statusSelect.selectOption('entwurf');

  const rows = page.locator('.admin-table tbody tr');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Berliner Dom');
});

// ═══════════════════════════════════════════════════════════
// FIL-03: Kombination Typ + Publish
// ═══════════════════════════════════════════════════════════
test('FIL-03: combined type + publish filter', async ({ page }) => {
  await loginAndWaitForTable(page);

  // Typ=grab + Status=veröffentlicht → only Alice
  const typSelect = page.locator('.admin-filter-group').filter({ hasText: 'Typ' }).locator('select');
  const statusSelect = page.locator('.admin-filter-group').filter({ hasText: 'Status' }).locator('select');

  await typSelect.selectOption('grab');
  await statusSelect.selectOption('veröffentlicht');

  const rows = page.locator('.admin-table tbody tr');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Alice Meier');
});

// ═══════════════════════════════════════════════════════════
// SRT-01: Sortierung nach Name
// ═══════════════════════════════════════════════════════════
test('SRT-01: sort by name toggles asc/desc', async ({ page }) => {
  await loginAndWaitForTable(page);

  const nameHeader = page.locator('th:has-text("Name")');
  const firstCell = page.locator('.admin-table tbody tr:first-child .name-cell');

  // Default is asc → Alice first
  await expect(firstCell).toContainText('Alice Meier');

  // Click name header → desc → Carl first
  await nameHeader.click();
  await expect(firstCell).toContainText('Carl Zille');

  // Click again → back to asc → Alice first
  await nameHeader.click();
  await expect(firstCell).toContainText('Alice Meier');
});

// ═══════════════════════════════════════════════════════════
// SRT-02: Sortierung nach Typ
// ═══════════════════════════════════════════════════════════
test('SRT-02: sort by type', async ({ page }) => {
  await loginAndWaitForTable(page);

  // Click "Typ" header
  await page.locator('th:has-text("Typ")').click();

  // "bauwerk" comes before "grab" alphabetically → Berliner Dom first
  const firstRow = page.locator('.admin-table tbody tr:first-child');
  await expect(firstRow).toContainText('Berliner Dom');
});

// ═══════════════════════════════════════════════════════════
// SRT-03: Sortierung nach Datum (with null handling)
// ═══════════════════════════════════════════════════════════
test('SRT-03: sort by Zeitraum puts null dates first in asc', async ({ page }) => {
  await loginAndWaitForTable(page);

  // Click "Zeitraum" header for asc sort
  await page.locator('th:has-text("Zeitraum")').click();

  // Berliner Dom has datum_von=null → '' sorts before real dates via localeCompare
  const firstRow = page.locator('.admin-table tbody tr:first-child');
  await expect(firstRow).toContainText('Berliner Dom');

  // Second should be Alice (1850) before Carl (1900)
  const secondRow = page.locator('.admin-table tbody tr:nth-child(2)');
  await expect(secondRow).toContainText('Alice Meier');
});
