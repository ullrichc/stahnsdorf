/**
 * Firebase Emulator Test Utilities for Playwright E2E Tests
 *
 * CRITICAL SAFETY: The Admin SDK MUST connect to the local emulator,
 * never to production. The environment variables below are set
 * unconditionally at module load time to prevent accidental live writes.
 */
import * as admin from 'firebase-admin';
import type { Page } from '@playwright/test';

// ─── SAFETY: Force emulator connection BEFORE any Admin SDK call ───
// This mirrors the pattern in scripts/setup-editors.ts.
// Without this, running `npx playwright test` outside of
// `firebase emulators:exec` would silently hit the LIVE database.
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// ─── Admin SDK singleton ───
const PROJECT_ID = 'stahnsdorf-90e03';

function getAdminApp(): admin.app.App {
  if (admin.apps.length === 0) {
    return admin.initializeApp({ projectId: PROJECT_ID });
  }
  return admin.apps[0]!;
}

function getAdminFirestore(): admin.firestore.Firestore {
  return getAdminApp().firestore();
}

// ─── Emulator REST endpoints ───
const FIRESTORE_EMULATOR = 'http://127.0.0.1:8080';
const AUTH_EMULATOR = 'http://127.0.0.1:9099';

/**
 * Central test setup helper — call in `beforeEach`.
 *
 * 1. Wipes all Firestore documents via emulator REST API
 * 2. Wipes all Auth emulator accounts to prevent popup flakes
 * 3. Re-seeds the `editors/{email}` whitelist doc via Admin SDK
 *    (bypasses security rules that block client writes to `editors/*`)
 */
export async function setupTestEnvironment(email: string): Promise<void> {
  // 1. Clear Firestore
  const firestoreResp = await fetch(
    `${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  if (!firestoreResp.ok) {
    throw new Error(`Firestore wipe failed: ${firestoreResp.status} ${await firestoreResp.text()}`);
  }

  // 2. Clear Auth accounts
  const authResp = await fetch(
    `${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`,
    { method: 'DELETE' },
  );
  if (!authResp.ok) {
    throw new Error(`Auth wipe failed: ${authResp.status} ${await authResp.text()}`);
  }

  // 3. Re-seed editor whitelist document (Admin SDK bypasses rules)
  const db = getAdminFirestore();
  await db.collection('editors').doc(email).set({
    role: 'editor',
    angelegt_am: new Date().toISOString(),
  });
}

/**
 * Seed test POIs into the emulator via Admin SDK.
 * Use this in `beforeEach` for tests that need pre-existing data.
 */
export async function seedTestPOIs(
  pois: Array<Record<string, any>>,
  authorEmail: string,
): Promise<void> {
  const db = getAdminFirestore();
  const now = admin.firestore.Timestamp.now();
  for (const poi of pois) {
    await db
      .collection('pois')
      .doc(poi.id)
      .set({
        ...poi,
        publish_status: poi.publish_status ?? 'veröffentlicht',
        erstellt_von: authorEmail,
        erstellt_am: now,
        geaendert_von: authorEmail,
        geaendert_am: now,
      });
  }
}

/**
 * Seed test Collections into the emulator via Admin SDK.
 */
export async function seedTestCollections(
  collections: Array<Record<string, any>>,
  authorEmail: string,
): Promise<void> {
  const db = getAdminFirestore();
  const now = admin.firestore.Timestamp.now();
  for (const col of collections) {
    await db
      .collection('collections')
      .doc(col.id)
      .set({
        ...col,
        publish_status: col.publish_status ?? 'veröffentlicht',
        erstellt_von: authorEmail,
        erstellt_am: now,
        geaendert_von: authorEmail,
        geaendert_am: now,
      });
  }
}

/**
 * Login helper for Playwright E2E tests.
 *
 * Firebase Auth uses IndexedDB for session persistence, which Playwright's
 * `storageState` cannot capture. Instead of caching sessions, we drive the
 * emulator's popup UI in every test:
 *
 *   1. Click the "Anmelden" button on the AuthGate login screen
 *   2. In the emulator popup: click "Add new account"
 *   3. Type the email address
 *   4. Click "Sign in with …"
 *
 * After the popup closes, the AuthGate will process the auth state change,
 * check the whitelist, and render the admin UI.
 */
export async function loginInPlaywright(
  page: Page,
  email: string,
): Promise<void> {
  // Wait for AuthGate to finish loading and show the login button
  const loginButton = page.locator('button.admin-btn-google');
  await loginButton.waitFor({ state: 'visible', timeout: 15_000 });

  // Click login — this opens the Firebase Auth Emulator popup
  const popupPromise = page.waitForEvent('popup');
  await loginButton.click();
  const popup = await popupPromise;

  // Wait for the emulator auth UI to load
  await popup.waitForLoadState('domcontentloaded');

  // Click "Add new account" in the emulator popup
  const addAccountButton = popup.locator('text=Add new account');
  await addAccountButton.waitFor({ state: 'visible', timeout: 10_000 });
  await addAccountButton.click();

  // Fill in the email field
  const emailInput = popup.locator('input[type="email"], input#email-input, input[name="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 5_000 });
  await emailInput.fill(email);

  // Click the sign-in button
  const signInButton = popup.locator('button:has-text("Sign in")');
  await signInButton.click();

  // Wait for popup to close and AuthGate to process the login
  // The sidebar becomes visible once the editor is authenticated
  await page.locator('.admin-sidebar').waitFor({ state: 'visible', timeout: 15_000 });
}

/**
 * Default test editor email used across all E2E specs.
 */
export const TEST_EDITOR_EMAIL = 'test-editor@example.com';
