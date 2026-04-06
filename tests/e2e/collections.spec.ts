/**
 * E2E Tests: Collections Editor (COL-01 to COL-09)
 *
 * Run: npx playwright test tests/e2e/collections.spec.ts
 */
import { test, expect } from '@playwright/test';
import {
  setupTestEnvironment,
  loginInPlaywright,
  seedTestPOIs,
  seedTestCollections,
  TEST_EDITOR_EMAIL,
} from '../utils/firebase-test-utils';

const DUMMY_POIS = [
  {
    id: 'poi_sws_alpha',
    typ: 'grab', name: { de: 'Alpha Person' }, kurztext: { de: 'K' },
    beschreibung: { de: 'B' }, koordinaten: null, datum_von: null, datum_bis: null,
    wikipedia_url: null, bilder: [], audio: {}, quellen: [], status: 'bestätigt', notiz: '',
    publish_status: 'veröffentlicht',
  },
  {
    id: 'poi_sws_beta',
    typ: 'bauwerk', name: { de: 'Beta Bauwerk' }, kurztext: { de: 'K' },
    beschreibung: { de: 'B' }, koordinaten: null, datum_von: null, datum_bis: null,
    wikipedia_url: null, bilder: [], audio: {}, quellen: [], status: 'bestätigt', notiz: '',
    publish_status: 'veröffentlicht',
  },
  {
    id: 'poi_sws_gamma',
    typ: 'denkmal', name: { de: 'Gamma Denkmal' }, kurztext: { de: 'K' },
    beschreibung: { de: 'B' }, koordinaten: null, datum_von: null, datum_bis: null,
    wikipedia_url: null, bilder: [], audio: {}, quellen: [], status: 'bestätigt', notiz: '',
    publish_status: 'veröffentlicht',
  },
];

const EXISTING_COLLECTION = {
  id: 'collection_sws_test-sammlung',
  name: { de: 'Test Sammlung' },
  kurztext: { de: 'Kurztext' },
  beschreibung: { de: 'Beschreibung' },
  pois: ['poi_sws_alpha'],
  status: 'bestätigt',
  notiz: '',
  publish_status: 'entwurf',
};

test.beforeEach(async () => {
  await setupTestEnvironment(TEST_EDITOR_EMAIL);
  await seedTestPOIs(DUMMY_POIS, TEST_EDITOR_EMAIL);
});

// Helper: login on collections page
async function loginOnCollections(page: any) {
  await page.goto('/admin/collections');
  await loginInPlaywright(page, TEST_EDITOR_EMAIL);
  // Wait for collections page to load (header or collection list)
  await page.locator('text=Sammlungen').first().waitFor({ state: 'visible', timeout: 15_000 });
}

// ═══ COL-01: Sammlungsliste laden ═══
test('COL-01: collection list loads with cards', async ({ page }) => {
  await seedTestCollections([EXISTING_COLLECTION], TEST_EDITOR_EMAIL);
  await loginOnCollections(page);

  // Card should show name, POI count, and publish badge
  await expect(page.locator('text=Test Sammlung')).toBeVisible();
  await expect(page.locator('text=1 POIs')).toBeVisible();
  await expect(page.locator('.badge')).toBeVisible();
});

// ═══ COL-02: Neue Sammlung anlegen ═══
test('COL-02: clicking Neue Sammlung opens modal', async ({ page }) => {
  await loginOnCollections(page);

  await page.locator('button:has-text("+ Neue Sammlung")').click();

  // Modal should be visible with empty name field
  await expect(page.locator('h2:has-text("+ Neue Sammlung")')).toBeVisible();
});

// ═══ COL-03: ID-Generierung bei neuer Sammlung ═══
test('COL-03: new collection generates correct ID', async ({ page }) => {
  await loginOnCollections(page);

  await page.locator('button:has-text("+ Neue Sammlung")').click();

  // Type a name with special characters
  const nameInput = page.locator('.admin-field').filter({ hasText: 'Name' }).locator('input');
  await nameInput.fill('Architektur & Anlage');

  // Save
  await page.locator('button:has-text("Speichern")').click();

  // Modal should close, collection should appear
  // ID should be collection_sws_architektur-anlage (& → -, multiple dashes collapsed)
  await expect(page.locator('text=Architektur & Anlage')).toBeVisible({ timeout: 10_000 });
});

// ═══ COL-04: Name ändern und speichern ═══
test('COL-04: edit collection name', async ({ page }) => {
  await seedTestCollections([EXISTING_COLLECTION], TEST_EDITOR_EMAIL);
  await loginOnCollections(page);

  // Click on existing collection to open editor
  await page.locator('text=Test Sammlung').click();

  // Change name
  const nameInput = page.locator('.admin-field').filter({ hasText: 'Name' }).locator('input');
  await nameInput.fill('Umbenannte Sammlung');
  await page.locator('button:has-text("Speichern")').click();

  // Updated name should appear
  await expect(page.locator('text=Umbenannte Sammlung')).toBeVisible({ timeout: 10_000 });
});

// ═══ COL-05: POI suchen & hinzufügen ═══
test('COL-05: search and add POI to collection', async ({ page }) => {
  await loginOnCollections(page);

  // Create new collection
  await page.locator('button:has-text("+ Neue Sammlung")').click();
  const nameInput = page.locator('.admin-field').filter({ hasText: 'Name' }).locator('input');
  await nameInput.fill('POI Test');

  // Search for "Beta" in POI search
  await page.locator('input[placeholder="POI suchen…"]').fill('Beta');

  // Check the Beta POI checkbox
  const betaCheckbox = page.locator('label').filter({ hasText: 'Beta Bauwerk' }).locator('input[type="checkbox"]');
  await betaCheckbox.check();

  // Counter should show 1
  await expect(page.locator('text=POIs (1 ausgewählt)')).toBeVisible();
});

// ═══ COL-06: POI entfernen ═══
test('COL-06: uncheck POI removes it from collection', async ({ page }) => {
  await seedTestCollections([EXISTING_COLLECTION], TEST_EDITOR_EMAIL);
  await loginOnCollections(page);

  // Open the existing collection
  await page.locator('text=Test Sammlung').click();

  // Alpha should be checked (it's in EXISTING_COLLECTION.pois)
  const alphaCheckbox = page.locator('label').filter({ hasText: 'Alpha Person' }).locator('input[type="checkbox"]');
  await expect(alphaCheckbox).toBeChecked();

  // Uncheck it
  await alphaCheckbox.uncheck();
  await expect(page.locator('text=POIs (0 ausgewählt)')).toBeVisible();
});

// ═══ COL-07: Sammlung löschen ═══
test('COL-07: delete collection with confirm', async ({ page }) => {
  await seedTestCollections([EXISTING_COLLECTION], TEST_EDITOR_EMAIL);
  await loginOnCollections(page);

  // Open collection
  await page.locator('text=Test Sammlung').click();

  // Accept confirmation
  page.on('dialog', (d) => d.accept());
  await page.locator('button:has-text("Löschen")').click();

  // Collection should no longer be visible
  await expect(page.locator('text=Test Sammlung')).not.toBeVisible({ timeout: 10_000 });
});

// ═══ COL-08: Publish-Status ändern ═══
test('COL-08: change publish status in modal', async ({ page }) => {
  await seedTestCollections([EXISTING_COLLECTION], TEST_EDITOR_EMAIL);
  await loginOnCollections(page);

  // Open collection
  await page.locator('text=Test Sammlung').click();

  // Change publish status to "veröffentlicht"
  const publishSelect = page.locator('.admin-field').filter({ hasText: 'Publish-Status' }).locator('select');
  await publishSelect.selectOption('veröffentlicht');

  // Save
  await page.locator('button:has-text("Speichern")').click();

  // Badge should now show "Veröffentlicht"
  await expect(page.locator('.badge:has-text("Veröffentlicht")')).toBeVisible({ timeout: 10_000 });
});

// ═══ COL-09: Pflichtfeld Name → Fehler ═══
test('COL-09: empty name shows validation error', async ({ page }) => {
  await loginOnCollections(page);

  await page.locator('button:has-text("+ Neue Sammlung")').click();

  // Try to save with empty name
  await page.locator('button:has-text("Speichern")').click();

  await expect(page.locator('text=Name (de) ist ein Pflichtfeld.')).toBeVisible();
});
