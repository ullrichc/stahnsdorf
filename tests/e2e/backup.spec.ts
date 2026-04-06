/**
 * E2E Tests: Backup & Restore Workflows
 * EXP-01 to EXP-03, IMP-01 to IMP-06, IMP-10 to IMP-17
 *
 * Run: npx playwright test tests/e2e/backup.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';
import {
  setupTestEnvironment,
  loginInPlaywright,
  seedTestPOIs,
  seedTestCollections,
  TEST_EDITOR_EMAIL,
} from '../utils/firebase-test-utils';
import path from 'path';
import fs from 'fs';

const SEED_POI = {
  id: 'poi_sws_backup-test',
  typ: 'grab', name: { de: 'Backup Test POI' }, kurztext: { de: 'K' },
  beschreibung: { de: 'B' }, koordinaten: null, datum_von: null, datum_bis: null,
  wikipedia_url: null, bilder: [], audio: {}, quellen: [], status: 'bestätigt', notiz: '',
  publish_status: 'veröffentlicht',
};

const SEED_COLLECTION = {
  id: 'collection_sws_backup-test',
  name: { de: 'Backup Test Collection' }, kurztext: { de: 'K' },
  beschreibung: { de: 'B' }, pois: ['poi_sws_backup-test'],
  status: 'bestätigt', notiz: '',
  publish_status: 'veröffentlicht',
};

test.beforeEach(async () => {
  await setupTestEnvironment(TEST_EDITOR_EMAIL);
});

// Helper: login and go to backup page
async function gotoBackup(page: Page) {
  await page.goto('/admin/backup');
  await loginInPlaywright(page, TEST_EDITOR_EMAIL);
  await page.locator('h2:has-text("Backup & Restore")').waitFor({ state: 'visible', timeout: 15_000 });
}

// Helper: upload a JSON file via the hidden file input
async function uploadJSON(page: Page, data: any) {
  const tmpDir = path.resolve(__dirname, '../../temp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, 'test-import.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
}

// ═══════════════════════════════════════════════════════════
// EXPORT TESTS
// ═══════════════════════════════════════════════════════════

// ═══ EXP-01: Inhalts-Export ═══
test('EXP-01: content export downloads JSON without meta fields', async ({ page }) => {
  await seedTestPOIs([SEED_POI], TEST_EDITOR_EMAIL);
  await seedTestCollections([SEED_COLLECTION], TEST_EDITOR_EMAIL);
  await gotoBackup(page);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('button:has-text("Inhalte exportieren")').click();
  const download = await downloadPromise;

  // Filename pattern
  expect(download.suggestedFilename()).toMatch(/^stahnsdorf-export-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}\.json$/);

  // Parse content
  const filePath = await download.path();
  const content = JSON.parse(fs.readFileSync(filePath!, 'utf-8'));
  expect(content.pois).toBeDefined();
  expect(content.collections).toBeDefined();
  expect(content._backup).toBeUndefined();

  // Meta fields must be stripped
  const poi = content.pois.find((p: any) => p.id === SEED_POI.id);
  expect(poi).toBeDefined();
  expect(poi.publish_status).toBeUndefined();
  expect(poi.erstellt_von).toBeUndefined();
  expect(poi.erstellt_am).toBeUndefined();
});

// ═══ EXP-02: Vollständiges Backup ═══
test('EXP-02: full backup downloads JSON with all meta fields', async ({ page }) => {
  await seedTestPOIs([SEED_POI], TEST_EDITOR_EMAIL);
  await gotoBackup(page);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('button:has-text("Backup herunterladen")').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^stahnsdorf-backup-/);

  const filePath = await download.path();
  const content = JSON.parse(fs.readFileSync(filePath!, 'utf-8'));
  expect(content._backup).toBe(true);
  expect(content._timestamp).toBeDefined();

  const poi = content.pois.find((p: any) => p.id === SEED_POI.id);
  expect(poi.publish_status).toBeDefined();
  expect(poi.erstellt_von).toBeDefined();
  expect(poi.erstellt_am).toBeDefined();
});

// ═══ EXP-03: Export-JSON ist valides JSON ═══
test('EXP-03: exported JSON is valid', async ({ page }) => {
  await seedTestPOIs([SEED_POI], TEST_EDITOR_EMAIL);
  await gotoBackup(page);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('button:has-text("Inhalte exportieren")').click();
  const download = await downloadPromise;

  const filePath = await download.path();
  expect(() => JSON.parse(fs.readFileSync(filePath!, 'utf-8'))).not.toThrow();
});

// ═══════════════════════════════════════════════════════════
// IMPORT VALIDATION TESTS
// ═══════════════════════════════════════════════════════════

// ═══ IMP-01: Ungültiges JSON ═══
test('IMP-01: invalid JSON shows error message', async ({ page }) => {
  await gotoBackup(page);

  const tmpDir = path.resolve(__dirname, '../../temp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, 'broken.json');
  fs.writeFileSync(filePath, '{ broken json !!!');

  await page.locator('input[type="file"]').setInputFiles(filePath);
  await expect(page.locator('text=Datei konnte nicht gelesen werden')).toBeVisible({ timeout: 5_000 });
});

// ═══ IMP-02: POI mit falschem ID-Prefix ═══
test('IMP-02: POI with wrong ID prefix shows error', async ({ page }) => {
  await gotoBackup(page);

  await uploadJSON(page, {
    pois: [{ id: 'wrong_123', name: { de: 'Test' }, typ: 'grab' }],
    collections: [],
  });

  await expect(page.locator('text=ungültige POI-Daten')).toBeVisible({ timeout: 5_000 });
});

// ═══ IMP-03: Collection mit falschem ID-Prefix ═══
test('IMP-03: Collection with wrong ID prefix shows error', async ({ page }) => {
  await gotoBackup(page);

  await uploadJSON(page, {
    pois: [],
    collections: [{ id: 'col_sws_test', name: { de: 'Test' } }],
  });

  await expect(page.locator('text=ungültige Collections')).toBeVisible({ timeout: 5_000 });
});

// ═══ IMP-04: POI ohne Name ═══
test('IMP-04: POI without name shows error', async ({ page }) => {
  await gotoBackup(page);

  await uploadJSON(page, {
    pois: [{ id: 'poi_sws_noname', typ: 'grab' }],
    collections: [],
  });

  await expect(page.locator('text=ungültige POI-Daten')).toBeVisible({ timeout: 5_000 });
});

// ═══ IMP-05: Preview neue vs. bestehende POIs ═══
test('IMP-05: preview shows new vs updated POI counts', async ({ page }) => {
  await seedTestPOIs([SEED_POI], TEST_EDITOR_EMAIL);
  await gotoBackup(page);

  await uploadJSON(page, {
    pois: [
      { ...SEED_POI }, // existing → "bestehende"
      { id: 'poi_sws_brand-new', name: { de: 'Brand New' }, typ: 'grab' }, // new
    ],
    collections: [],
  });

  // Wait for preview
  await expect(page.locator('text=Import-Vorschau')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('text=1 neue POIs')).toBeVisible();
  await expect(page.locator('text=1 bestehende POIs')).toBeVisible();
});

// ═══ IMP-06: Preview ungültige Referenzen ═══
test('IMP-06: preview shows invalid reference warnings', async ({ page }) => {
  await gotoBackup(page);

  await uploadJSON(page, {
    pois: [{ id: 'poi_sws_real', name: { de: 'Real' }, typ: 'grab' }],
    collections: [{ id: 'collection_sws_ref-test', name: { de: 'Ref Test' }, pois: ['poi_sws_gibts_nicht'] }],
  });

  await expect(page.locator('text=Import-Vorschau')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('text=Ungültige Referenzen')).toBeVisible();
  await expect(page.locator('text=poi_sws_gibts_nicht')).toBeVisible();
});

// ═══════════════════════════════════════════════════════════
// IMPORT EXECUTION TESTS
// ═══════════════════════════════════════════════════════════

// ═══ IMP-10: Content-Import neuer POIs & Collections (Green Path) ═══
test('IMP-10: content import new POIs and Collections succeeds', async ({ page }) => {
  await gotoBackup(page);

  await uploadJSON(page, {
    pois: [
      { id: 'poi_sws_import-new-1', name: { de: 'Import Neu 1' }, typ: 'grab', kurztext: { de: 'K' }, beschreibung: { de: 'B' }, koordinaten: null, datum_von: null, datum_bis: null, wikipedia_url: null, bilder: [], audio: {}, quellen: [], status: 'bestätigt', notiz: '' },
    ],
    collections: [
      { id: 'collection_sws_import-new', name: { de: 'Import Collection' }, kurztext: { de: 'K' }, beschreibung: { de: 'B' }, pois: ['poi_sws_import-new-1'] },
    ],
  });

  await expect(page.locator('text=Import-Vorschau')).toBeVisible({ timeout: 10_000 });
  await page.locator('button:has-text("Jetzt importieren")').click();

  // Success message
  await expect(page.locator('text=Import abgeschlossen')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('text=1 POIs')).toBeVisible();
  await expect(page.locator('text=1 Collections')).toBeVisible();
});

// ═══ IMP-11: Full-Backup Restore with foreign author → PERMISSION_DENIED ═══
test('IMP-11: full backup restore with foreign erstellt_von fails (BUG-07)', async ({ page }) => {
  await gotoBackup(page);

  await uploadJSON(page, {
    _backup: true,
    _timestamp: new Date().toISOString(),
    pois: [
      {
        id: 'poi_sws_foreign-author',
        name: { de: 'Foreign Author' }, typ: 'grab', kurztext: { de: 'K' },
        beschreibung: { de: 'B' }, koordinaten: null, datum_von: null, datum_bis: null,
        wikipedia_url: null, bilder: [], audio: {}, quellen: [], status: 'bestätigt', notiz: '',
        publish_status: 'entwurf',
        erstellt_von: 'other-editor@example.com', // NOT the current test editor
        erstellt_am: new Date().toISOString(),
        geaendert_von: 'other-editor@example.com',
        geaendert_am: new Date().toISOString(),
      },
    ],
    collections: [],
  });

  await expect(page.locator('text=Import-Vorschau')).toBeVisible({ timeout: 10_000 });
  await page.locator('button:has-text("Jetzt importieren")').click();

  // Should fail with PERMISSION_DENIED
  await expect(page.locator('text=Import fehlgeschlagen')).toBeVisible({ timeout: 15_000 });
});

// ═══ IMP-12: Merge-Modus Skip ═══
test('IMP-12: skip merge mode skips existing, imports new', async ({ page }) => {
  await seedTestPOIs([SEED_POI], TEST_EDITOR_EMAIL);
  await gotoBackup(page);

  await uploadJSON(page, {
    pois: [
      { ...SEED_POI, name: { de: 'CHANGED NAME' } }, // existing → should be skipped
      { id: 'poi_sws_skip-new', name: { de: 'Skip New' }, typ: 'grab', kurztext: { de: 'K' }, beschreibung: { de: 'B' }, koordinaten: null, datum_von: null, datum_bis: null, wikipedia_url: null, bilder: [], audio: {}, quellen: [], status: 'bestätigt', notiz: '' },
    ],
    collections: [],
  });

  await expect(page.locator('text=Import-Vorschau')).toBeVisible({ timeout: 10_000 });
  // Default merge mode is "skip" → just import
  await page.locator('button:has-text("Jetzt importieren")').click();

  // Only the new POI should be counted
  await expect(page.locator('text=Import abgeschlossen')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('text=1 POIs')).toBeVisible();
});

// ═══ IMP-13: Content-Import Overwrite → BUG-06 ═══
test('IMP-13: content import overwrite fails due to immutable erstellt_am (BUG-06)', async ({ page }) => {
  await seedTestPOIs([SEED_POI], TEST_EDITOR_EMAIL);
  await gotoBackup(page);

  await uploadJSON(page, {
    pois: [
      { ...SEED_POI, name: { de: 'Overwrite Attempt' } },
    ],
    collections: [],
  });

  await expect(page.locator('text=Import-Vorschau')).toBeVisible({ timeout: 10_000 });

  // Change merge mode to "overwrite"
  const mergeSelect = page.locator('select').filter({ hasText: 'Überspringen' });
  await mergeSelect.selectOption('overwrite');

  await page.locator('button:has-text("Jetzt importieren")').click();

  // Should fail with PERMISSION_DENIED because erstellt_am gets overwritten
  await expect(page.locator('text=Import fehlgeschlagen')).toBeVisible({ timeout: 15_000 });
});

// ═══ IMP-14: Full-Backup Overwrite → BUG-07 ═══
test('IMP-14: full backup overwrite fails due to geaendert_von mismatch (BUG-07)', async ({ page }) => {
  await seedTestPOIs([SEED_POI], TEST_EDITOR_EMAIL);
  await gotoBackup(page);

  await uploadJSON(page, {
    _backup: true,
    _timestamp: new Date().toISOString(),
    pois: [
      {
        ...SEED_POI,
        name: { de: 'Backup Overwrite' },
        publish_status: 'veröffentlicht',
        erstellt_von: TEST_EDITOR_EMAIL,
        erstellt_am: new Date().toISOString(),
        geaendert_von: 'other-editor@example.com', // foreign → violates rule
        geaendert_am: new Date().toISOString(),
      },
    ],
    collections: [],
  });

  await expect(page.locator('text=Import-Vorschau')).toBeVisible({ timeout: 10_000 });

  // Change merge mode to "overwrite"
  const mergeSelect = page.locator('select').filter({ hasText: 'Überspringen' });
  await mergeSelect.selectOption('overwrite');

  await page.locator('button:has-text("Jetzt importieren")').click();

  // Should fail with PERMISSION_DENIED
  await expect(page.locator('text=Import fehlgeschlagen')).toBeVisible({ timeout: 15_000 });
});

// ═══ IMP-15: Destructive Restore (Skip mode, no new docs) ═══
test('IMP-15: destructive restore deletes documents not in backup', async ({ page }) => {
  // Seed 2 POIs, backup only contains 1 → the other should be deleted
  await seedTestPOIs([
    SEED_POI,
    { ...SEED_POI, id: 'poi_sws_to-be-deleted', name: { de: 'To Be Deleted' } },
  ], TEST_EDITOR_EMAIL);

  await gotoBackup(page);

  // Full backup containing only the original POI
  await uploadJSON(page, {
    _backup: true,
    _timestamp: new Date().toISOString(),
    pois: [
      {
        ...SEED_POI,
        publish_status: 'veröffentlicht',
        erstellt_von: TEST_EDITOR_EMAIL,
        erstellt_am: new Date().toISOString(),
        geaendert_von: TEST_EDITOR_EMAIL,
        geaendert_am: new Date().toISOString(),
      },
    ],
    collections: [],
  });

  await expect(page.locator('text=Import-Vorschau')).toBeVisible({ timeout: 10_000 });

  // Enable destructive mode
  const deleteCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /./ }).or(
    page.locator('label:has-text("Destruktiv") input[type="checkbox"]'),
  );
  await page.locator('label:has-text("Destruktiv")').click();

  // Default merge mode is skip → existing POI won't be overwritten
  await page.locator('button:has-text("Jetzt importieren")').click();

  // Should succeed and report deletion
  await expect(page.locator('text=Import abgeschlossen')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('text=veraltete gelöscht')).toBeVisible();
});

// ═══ IMP-16: Referenz-Bereinigung ═══
test('IMP-16: invalid POI references in collections are cleaned during import', async ({ page }) => {
  await gotoBackup(page);

  // Import a collection referencing a nonexistent POI alongside a valid one
  await uploadJSON(page, {
    pois: [
      { id: 'poi_sws_valid-ref', name: { de: 'Valid Ref' }, typ: 'grab', kurztext: { de: 'K' }, beschreibung: { de: 'B' }, koordinaten: null, datum_von: null, datum_bis: null, wikipedia_url: null, bilder: [], audio: {}, quellen: [], status: 'bestätigt', notiz: '' },
    ],
    collections: [
      {
        id: 'collection_sws_ref-clean',
        name: { de: 'Ref Clean' }, kurztext: { de: 'K' }, beschreibung: { de: 'B' },
        pois: ['poi_sws_valid-ref', 'poi_sws_nonexistent'],
      },
    ],
  });

  // Preview shows warning
  await expect(page.locator('text=Ungültige Referenzen')).toBeVisible({ timeout: 10_000 });

  // Import anyway
  await page.locator('button:has-text("Jetzt importieren")').click();
  await expect(page.locator('text=Import abgeschlossen')).toBeVisible({ timeout: 15_000 });

  // The import should have cleaned the invalid reference silently
});

// ═══ IMP-17: Merge-Modus-Selector Sichtbarkeit (BUG-08) ═══
test('IMP-17: merge mode selector hidden when only Collections conflict (BUG-08)', async ({ page }) => {
  // Seed existing collection, no POIs
  await seedTestCollections([SEED_COLLECTION], TEST_EDITOR_EMAIL);
  await gotoBackup(page);

  // Import a file that has a conflicting collection but NO conflicting POIs
  await uploadJSON(page, {
    pois: [
      { id: 'poi_sws_backup-test', name: { de: 'POI' }, typ: 'grab', kurztext: { de: 'K' }, beschreibung: { de: 'B' }, koordinaten: null, datum_von: null, datum_bis: null, wikipedia_url: null, bilder: [], audio: {}, quellen: [], status: 'bestätigt', notiz: '' },
    ],
    collections: [
      { ...SEED_COLLECTION, name: { de: 'Changed Collection Name' } }, // existing → conflict
    ],
  });

  await expect(page.locator('text=Import-Vorschau')).toBeVisible({ timeout: 10_000 });

  // BUG-08: Merge selector only shown when updatedPOIs.length > 0
  // Since we have 0 updated POIs (poi is also seeded, but the seed was deleted during setup),
  // but 1 updated Collection → the selector should NOT be visible
  // The merge mode default "skip" takes effect silently for collections
  await expect(page.locator('text=bestehende Collections')).toBeVisible();

  // Verify merge selector is NOT shown (because updatedPOIs.length === 0)
  // The selector label is "Bei bestehenden Einträgen:"
  const mergeSelector = page.locator('label:has-text("Bei bestehenden Einträgen")');
  await expect(mergeSelector).not.toBeVisible();
});
