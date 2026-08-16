# Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve every blocker, important issue, and optional issue in the 2026-08-16 release review.

**Architecture:** Keep Firestore and the content schema intact. Add small pure helpers for routes, assets, IDs, image metadata, and import limits; use static query pages for runtime IDs; harden visitor and admin components around those helpers.

**Tech Stack:** Next.js 16 static export, React 18, TypeScript, Firebase, Leaflet, Vitest, Playwright, lucide-react

---

### Task 1: Pure helpers and regression tests

**Files:** `src/lib/redirect.ts`, `src/lib/redirect.test.ts`, `src/lib/app-path.ts`, `src/lib/app-path.test.ts`, `src/lib/slug.ts`, `src/lib/slug.test.ts`, `src/lib/i18n.ts`, `src/lib/i18n.test.ts`, `src/lib/admin-data.ts`, `src/lib/admin-data.test.ts`

- [ ] Write failing tests for canonical routes, legacy redirects, backslash rejection, basePath assets, missing localized text, ID suffixes, image cleanup, and batch size validation.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement minimal helpers and make focused tests pass.

### Task 2: Static routes and fallback

**Files:** `src/app/poi/page.tsx`, `src/app/poi/POIQueryPageClient.tsx`, `src/app/admin/poi/edit/page.tsx`, `src/app/admin/poi/edit/EditPOIQueryClient.tsx`, `src/app/not-found.tsx`, `src/app/page.tsx`, `src/app/admin/page.tsx`, `src/components/POICard.tsx`, `src/components/admin/POIForm.tsx`, `public/404.html`

- [ ] Add Suspense-wrapped query pages and missing-ID states.
- [ ] Migrate generated links and post-create navigation.
- [ ] Generate the deployed 404 fallback through App Router and remove the overwritten public file.
- [ ] Update route E2E expectations.

### Task 3: Firestore visitor resilience and localization

**Files:** `src/lib/useFirestore.ts`, `src/lib/useGeolocation.ts`, `src/lib/geo.ts`, `src/lib/ui-dictionary.ts`, detail/collection/map components

- [ ] Add cancellation, retry, not-found separation, and strict coordinate filtering.
- [ ] Add localized loading, error, retry, map, location, lightbox, and ARIA strings in all six languages.
- [ ] Implement 30-second continuous geolocation, map accuracy circle, visible errors, and cleanup.

### Task 4: Audio, accessibility, and offline icons

**Files:** `src/components/AudioPlayer.tsx`, `src/components/AudioPlayer.module.css`, `src/components/AppIcon.tsx`, all Material Symbol consumers, `src/app/layout.tsx`, lightbox, navigation, language and info components

- [ ] Install and use lucide-react; remove runtime Google icon font.
- [ ] Harden audio URL, lifecycle, play promise, metadata, and keyboard seek behavior.
- [ ] Restore browser zoom, lightbox focus/scroll behavior, tel links, and navigation ARIA state.

### Task 5: Admin integrity

**Files:** `src/components/admin/POIImagesEditor.tsx`, `src/components/admin/POIForm.tsx`, `src/components/admin/BackupRestore.tsx`, `src/components/admin/AuthGate.tsx`, `src/components/admin/AdminSidebar.tsx`

- [ ] Keep image metadata edits local and remove empty optional fields.
- [ ] Batch collection cleanup plus POI delete with fresh audit fields.
- [ ] Prepare backup operations and commit one atomic batch or reject before writing.
- [ ] Resolve new-ID collisions with deterministic suffixes inside a Firestore transaction.
- [ ] Distinguish AuthGate network failures and add retry.
- [ ] Validate coordinate pairs and preserve unchanged coordinate provenance.
- [ ] Remove duplicate admin navigation and update E2E expectations.

### Task 6: Documentation and verification

**Files:** `AGENTS.md`, `README.md`, `.gitignore`, `.github/workflows/test.yml`, `.github/workflows/deploy.yml`

- [ ] Document static query routes, retry/offline behavior, atomic import limit, and icon dependency.
- [ ] Ignore generated cache/output paths.
- [ ] Gate deployment on the successful test workflow and add production build/artifact checks to CI.
- [ ] Run the complete Unit suite and production build.
- [ ] Run TypeScript, Rules, and emulator-backed E2E verification.
- [ ] Verify exported query pages and redirecting `out/404.html`.
- [ ] Record the remaining real-device Android Chrome/Firefox release checklist.
- [ ] Inspect the final diff without altering unrelated user files.
