/**
 * E2E Tests: Auth & Navigation (AUTH-01 to AUTH-04, NAV-01 to NAV-05)
 *
 * Run: npx playwright test tests/e2e/auth-nav.spec.ts
 * (requires Firebase Emulator running: npm run emulators)
 */
import { test, expect } from '@playwright/test';
import {
  setupTestEnvironment,
  loginInPlaywright,
  TEST_EDITOR_EMAIL,
} from '../utils/firebase-test-utils';

const NON_EDITOR_EMAIL = 'not-whitelisted@example.com';

test.beforeEach(async () => {
  await setupTestEnvironment(TEST_EDITOR_EMAIL);
});

// ═══════════════════════════════════════════════════════════
// AUTH-01: Erfolgreicher Login (Whitelist-Editor)
// ═══════════════════════════════════════════════════════════
test('AUTH-01: successful login shows sidebar and POI table', async ({ page }) => {
  await page.goto('/admin');
  await loginInPlaywright(page, TEST_EDITOR_EMAIL);

  // Sidebar visible with brand
  const sidebar = page.locator('.admin-sidebar');
  await expect(sidebar).toBeVisible();
  await expect(sidebar.locator('.admin-sidebar-title')).toHaveText('The Eternal Archive');

  // User name displayed in sidebar footer
  await expect(sidebar.locator('.admin-sidebar-user-role')).toHaveText('Archivist Mode');

  // Main content area shows POI table (the dashboard is the default admin page)
  await expect(page.locator('table, .admin-section-title')).toBeVisible({ timeout: 10_000 });
});

// ═══════════════════════════════════════════════════════════
// AUTH-02: Login mit nicht-whitelisteter Email
// ═══════════════════════════════════════════════════════════
test('AUTH-02: non-whitelisted login shows access denied', async ({ page }) => {
  await page.goto('/admin');

  // Login with a non-whitelisted email
  const loginButton = page.locator('button.admin-btn-google');
  await loginButton.waitFor({ state: 'visible', timeout: 15_000 });

  const popupPromise = page.waitForEvent('popup');
  await loginButton.click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');

  const addAccountButton = popup.locator('text=Add new account');
  await addAccountButton.waitFor({ state: 'visible', timeout: 10_000 });
  await addAccountButton.click();

  const emailInput = popup.locator('input[type="email"], input#email-input, input[name="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 5_000 });
  await emailInput.fill(NON_EDITOR_EMAIL);

  const signInButton = popup.locator('button:has-text("Sign in")');
  await signInButton.click();

  // Should show "Zugriff verweigert" in-place, NOT a redirect
  const deniedContainer = page.locator('.admin-auth-denied');
  await expect(deniedContainer).toBeVisible({ timeout: 15_000 });
  await expect(deniedContainer).toContainText('Zugriff verweigert');
  await expect(page.locator('.admin-auth-email')).toContainText(NON_EDITOR_EMAIL);

  // "Mit anderem Konto anmelden" button is visible
  await expect(page.locator('button:has-text("Mit anderem Konto anmelden")')).toBeVisible();
});

// ═══════════════════════════════════════════════════════════
// AUTH-03: Direktzugriff /admin/backup ohne Session
// ═══════════════════════════════════════════════════════════
test('AUTH-03: direct access to /admin/backup without session shows login', async ({ page }) => {
  await page.goto('/admin/backup');

  // AuthGate renders login card in-place — no redirect
  const loginCard = page.locator('.admin-login-card');
  await expect(loginCard).toBeVisible({ timeout: 15_000 });
  await expect(loginCard).toContainText('Redaktionswerkzeug');

  // URL should still be /admin/backup (no redirect)
  expect(page.url()).toContain('/admin/backup');
});

// ═══════════════════════════════════════════════════════════
// AUTH-04: Abmelden über Sidebar-Button
// ═══════════════════════════════════════════════════════════
test('AUTH-04: logout via sidebar button returns to login', async ({ page }) => {
  await page.goto('/admin');
  await loginInPlaywright(page, TEST_EDITOR_EMAIL);

  // Click the logout button in the sidebar
  await page.locator('.admin-sidebar-logout').click();

  // AuthGate should re-render the login card
  const loginCard = page.locator('.admin-login-card');
  await expect(loginCard).toBeVisible({ timeout: 15_000 });
});

// ═══════════════════════════════════════════════════════════
// NAV-01: Sidebar sichtbar nach Login mit 4 Links
// ═══════════════════════════════════════════════════════════
test('NAV-01: sidebar shows 4 navigation links after login', async ({ page }) => {
  await page.goto('/admin');
  await loginInPlaywright(page, TEST_EDITOR_EMAIL);

  const navLinks = page.locator('.admin-sidebar-nav .admin-sidebar-link');
  await expect(navLinks).toHaveCount(4);

  // Verify link labels
  await expect(navLinks.nth(0)).toContainText('Übersicht');
  await expect(navLinks.nth(1)).toContainText('POIs');
  await expect(navLinks.nth(2)).toContainText('Sammlungen');
  await expect(navLinks.nth(3)).toContainText('Backup');
});

// ═══════════════════════════════════════════════════════════
// NAV-02: Active-State on /admin — BUG-01 validation
// ═══════════════════════════════════════════════════════════
test('NAV-02: both Übersicht and POIs are .active on /admin (BUG-01)', async ({ page }) => {
  await page.goto('/admin');
  await loginInPlaywright(page, TEST_EDITOR_EMAIL);

  const navLinks = page.locator('.admin-sidebar-nav .admin-sidebar-link');

  // Both "Übersicht" and "POIs" link to /admin with exact:true, so both should be .active
  await expect(navLinks.nth(0)).toHaveClass(/active/);
  await expect(navLinks.nth(1)).toHaveClass(/active/);

  // "Sammlungen" and "Backup" should NOT be active
  await expect(navLinks.nth(2)).not.toHaveClass(/active/);
  await expect(navLinks.nth(3)).not.toHaveClass(/active/);
});

// ═══════════════════════════════════════════════════════════
// NAV-03: Active-State on /admin/collections
// ═══════════════════════════════════════════════════════════
test('NAV-03: Sammlungen link is .active on /admin/collections', async ({ page }) => {
  await page.goto('/admin/collections');
  await loginInPlaywright(page, TEST_EDITOR_EMAIL);

  const navLinks = page.locator('.admin-sidebar-nav .admin-sidebar-link');
  await expect(navLinks.nth(2)).toHaveClass(/active/);
  // Others should not be active
  await expect(navLinks.nth(0)).not.toHaveClass(/active/);
  await expect(navLinks.nth(1)).not.toHaveClass(/active/);
});

// ═══════════════════════════════════════════════════════════
// NAV-04: Active-State on /admin/backup
// ═══════════════════════════════════════════════════════════
test('NAV-04: Backup link is .active on /admin/backup', async ({ page }) => {
  await page.goto('/admin/backup');
  await loginInPlaywright(page, TEST_EDITOR_EMAIL);

  const navLinks = page.locator('.admin-sidebar-nav .admin-sidebar-link');
  await expect(navLinks.nth(3)).toHaveClass(/active/);
});

// ═══════════════════════════════════════════════════════════
// NAV-05: Navigation zu Sammlungen
// ═══════════════════════════════════════════════════════════
test('NAV-05: clicking Sammlungen navigates to /admin/collections', async ({ page }) => {
  await page.goto('/admin');
  await loginInPlaywright(page, TEST_EDITOR_EMAIL);

  // Click the "Sammlungen" link
  await page.locator('.admin-sidebar-link:has-text("Sammlungen")').click();

  // Wait for URL change
  await page.waitForURL('**/admin/collections');
  expect(page.url()).toContain('/admin/collections');
});
