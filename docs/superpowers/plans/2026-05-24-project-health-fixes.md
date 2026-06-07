# Project Health Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the project back to a trustworthy green state by fixing test drift, Rules test execution, static-export deep-link behavior, schema drift, and small Admin UI mismatches.

**Architecture:** Keep changes small and local. Preserve the current Firestore-first runtime architecture and static-export strategy, but add the missing client redirect bridge and align helper code/tests with the documented schema. Treat `docs/schema.md` as the source of truth and update docs only when behavior actually changes.

**Tech Stack:** Next.js 16 App Router static export, React 18, TypeScript 6, Firebase Firestore/Auth, Vitest, Firebase Emulator Suite, Playwright.

---

## File Structure

- Modify: `src/lib/content.test.ts`  
  Responsibility: Unit tests for deprecated JSON snapshot helpers should assert behavior against the actual unified snapshot, not removed legacy fixtures.
- Modify: `vitest.config.ts`  
  Responsibility: Keep normal unit tests excluding Rules tests while allowing the explicit Rules test command to run.
- Modify: `package.json`  
  Responsibility: If needed, pass a Rules-specific Vitest config or flags so `npm run test:rules` executes `tests/rules/firestore.rules.test.ts`.
- Create optional: `vitest.rules.config.ts`  
  Responsibility: Dedicated Vitest config for Firestore Rules tests if simpler than conditional config in `vitest.config.ts`.
- Modify: `src/app/page.tsx`  
  Responsibility: Client-side app shell should consume `?redirect=` from `public/404.html` and route to the requested path.
- Modify: `src/lib/i18n.ts`  
  Responsibility: Implement documented fallback: requested locale -> German -> first available translation -> empty string.
- Modify: `src/lib/i18n.test.ts`  
  Responsibility: Lock the full fallback chain with unit tests.
- Create optional: `src/lib/slug.ts`  
  Responsibility: Centralize schema-compliant ID slug generation with German transliteration.
- Create optional: `src/lib/slug.test.ts`  
  Responsibility: Lock POI/Collection ID slug behavior.
- Modify: `src/components/admin/POIForm.tsx`  
  Responsibility: Use schema-compliant ID generation for new POIs.
- Modify: `src/app/admin/collections/page.tsx`  
  Responsibility: Use schema-compliant ID generation for new Collections and preserve creation audit fields on collection updates.
- Modify: `src/app/admin/page.tsx`  
  Responsibility: Align Admin search/filter controls with visible UI claims.
- Modify: `README.md`, `AGENTS.md`, `docs/schema.md` only if behavior or documented workflows change.

---

### Task 1: Fix Deprecated Content Helper Unit Tests

**Files:**
- Modify: `src/lib/content.test.ts`
- Reference: `src/lib/content.ts`
- Reference: `data/stahnsdorf-backup-translated.json`

- [ ] **Step 1: Replace mocks for removed JSON files**

Remove the `vi.mock('../../data/pois.json', ...)` and `vi.mock('../../data/collections.json', ...)` blocks. These files are no longer used by `src/lib/content.ts`.

- [ ] **Step 2: Write snapshot-based assertions**

Use the actual unified backup to compute expectations, then assert helper behavior against those expectations:

```ts
import backupData from '../../data/stahnsdorf-backup-translated.json'
import { getAllPOIs, getPOIById, getAllCollections, getCollectionById } from './content'

const snapshotPois = backupData.pois as any[]
const snapshotCollections = backupData.collections as any[]
const expectedMappedPoiIds = new Set(
  snapshotPois.filter((poi) => poi.koordinaten !== null).map((poi) => poi.id)
)
```

Add/adjust tests:

```ts
test('returns all snapshot POIs with coordinates', () => {
  const pois = getAllPOIs()
  expect(pois).toHaveLength(expectedMappedPoiIds.size)
  expect(pois.every((poi) => poi.koordinaten !== null)).toBe(true)
})

test('finds a mapped POI by ID', () => {
  const expected = snapshotPois.find((poi) => poi.koordinaten !== null)!
  expect(getPOIById(expected.id)?.id).toBe(expected.id)
})

test('returns undefined for a POI without coordinates', () => {
  const withoutCoords = snapshotPois.find((poi) => poi.koordinaten === null)
  if (!withoutCoords) return
  expect(getPOIById(withoutCoords.id)).toBeUndefined()
})
```

- [ ] **Step 3: Keep collection filtering behavior covered**

Assert that all returned collection POI references point to mapped POIs:

```ts
test('filters collection references to mapped POIs only', () => {
  for (const collection of getAllCollections()) {
    expect(collection.pois.every((poiId) => expectedMappedPoiIds.has(poiId))).toBe(true)
  }
})
```

- [ ] **Step 4: Run unit tests**

Run:

```bash
npm test
```

Expected: all non-Rules unit tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content.test.ts
git commit -m "test: align content helper tests with unified snapshot"
```

---

### Task 2: Fix Firestore Rules Test Execution

**Files:**
- Modify: `package.json`
- Modify or create: `vitest.rules.config.ts`
- Reference: `vitest.config.ts`
- Reference: `tests/rules/firestore.rules.test.ts`

- [ ] **Step 1: Add a Rules-specific Vitest config**

Create `vitest.rules.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2: Point `test:rules` at that config**

In `package.json`, change:

```json
"test:rules": "firebase emulators:exec \"npx vitest run tests/rules/firestore.rules.test.ts\""
```

to:

```json
"test:rules": "firebase emulators:exec \"npx vitest run --config vitest.rules.config.ts\""
```

- [ ] **Step 3: Verify Rules tests run**

Run:

```bash
npm run test:rules
```

Expected: Vitest discovers and executes `tests/rules/firestore.rules.test.ts`. If tests fail after discovery, treat those as real Rules failures and fix them separately using `systematic-debugging`.

- [ ] **Step 4: Verify normal unit tests still exclude Rules**

Run:

```bash
npm test
```

Expected: normal unit tests pass and do not run `tests/rules/**`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.rules.config.ts
git commit -m "test: add dedicated firestore rules test config"
```

---

### Task 3: Implement GitHub Pages Deep-Link Redirect Handling

**Files:**
- Modify: `src/app/page.tsx`
- Reference: `public/404.html`
- Test optional: `tests/e2e/*` if adding E2E coverage is practical

- [ ] **Step 1: Write or identify expected behavior**

Manual expected behavior:

- Visiting `/?redirect=%2Fsammlungen` routes to `/sammlungen`.
- Visiting `/?redirect=%2Fpoi%2Fpoi_sws_adolf-bastian` routes to `/poi/poi_sws_adolf-bastian`.
- Invalid external-looking redirect values such as `https://example.com` are ignored.

- [ ] **Step 2: Convert `src/app/page.tsx` to consume search params**

Replace the current component with a client component that uses `useSearchParams` and `useRouter`:

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DynamicMapView from '@/components/DynamicMapView'

export default function MapPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const redirect = searchParams.get('redirect')
    if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return
    router.replace(redirect)
  }, [router, searchParams])

  return <DynamicMapView showSearch={true} />
}
```

- [ ] **Step 3: Build to verify static export accepts the change**

Run:

```bash
npm run build
```

Expected: build passes. If Next.js requires a Suspense boundary around `useSearchParams`, split the redirect logic into a tiny child component and wrap it in `<Suspense fallback={null}>`.

- [ ] **Step 4: Manual browser check**

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/?redirect=%2Fsammlungen
```

Expected: route changes to `/sammlungen`.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix: handle github pages deep-link redirects"
```

---

### Task 4: Align Localized Text Fallback With Schema

**Files:**
- Modify: `src/lib/i18n.ts`
- Modify: `src/lib/i18n.test.ts`
- Reference: `docs/schema.md`

- [ ] **Step 1: Write failing fallback test**

Add:

```ts
test('falls back to first available translation when requested locale and de are missing', () => {
  expect(t({ en: 'Hello', fr: 'Bonjour' } as any, 'pl')).toBe('Hello')
})
```

- [ ] **Step 2: Run the focused test**

Run:

```bash
npx vitest run src/lib/i18n.test.ts
```

Expected before implementation: FAIL because current fallback returns `''`.

- [ ] **Step 3: Implement fallback**

Change `src/lib/i18n.ts`:

```ts
import { LocalizedText } from './types'

const DEFAULT_LOCALE = 'de'

export function t(str: LocalizedText, locale: string = DEFAULT_LOCALE): string {
  return str[locale] || str.de || Object.values(str).find(Boolean) || ''
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npx vitest run src/lib/i18n.test.ts
npm test
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n.ts src/lib/i18n.test.ts
git commit -m "fix: implement localized text fallback chain"
```

---

### Task 5: Centralize Schema-Compliant ID Slugs

**Files:**
- Create: `src/lib/slug.ts`
- Create: `src/lib/slug.test.ts`
- Modify: `src/components/admin/POIForm.tsx`
- Modify: `src/app/admin/collections/page.tsx`
- Reference: `docs/schema.md`

- [ ] **Step 1: Write slug tests**

Create `src/lib/slug.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { makeCollectionId, makePOIId, slugifyKennung } from './slug'

describe('slugifyKennung', () => {
  test('transliterates German umlauts and sharp s', () => {
    expect(slugifyKennung('Müller, Größe & Öl')).toBe('mueller-groesse-oel')
  })

  test('collapses separators and trims hyphens', () => {
    expect(slugifyKennung('  Heinrich   Zille!  ')).toBe('heinrich-zille')
  })
})

test('makePOIId adds poi prefix', () => {
  expect(makePOIId('Heinrich Zille')).toBe('poi_sws_heinrich-zille')
})

test('makeCollectionId adds collection prefix', () => {
  expect(makeCollectionId('Architektur & Anlage')).toBe('collection_sws_architektur-anlage')
})
```

- [ ] **Step 2: Run the failing slug tests**

Run:

```bash
npx vitest run src/lib/slug.test.ts
```

Expected: FAIL because `src/lib/slug.ts` does not exist.

- [ ] **Step 3: Implement slug helper**

Create `src/lib/slug.ts`:

```ts
const UMLAUTS: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
}

export function slugifyKennung(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => UMLAUTS[char] ?? char)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function makePOIId(name: string): string {
  return `poi_sws_${slugifyKennung(name)}`
}

export function makeCollectionId(name: string): string {
  return `collection_sws_${slugifyKennung(name)}`
}
```

- [ ] **Step 4: Use helper in POI and Collection creation**

In `src/components/admin/POIForm.tsx`, import:

```ts
import { makePOIId } from '@/lib/slug'
```

Replace the inline ID generation:

```ts
? 'poi_sws_' + name.toLowerCase().replace(/[^a-z0-9äöüß]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
```

with:

```ts
? makePOIId(name)
```

In `src/app/admin/collections/page.tsx`, import:

```ts
import { makeCollectionId } from '@/lib/slug'
```

Replace the inline Collection ID generation with:

```ts
? makeCollectionId(name)
```

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
npx vitest run src/lib/slug.test.ts
npm test
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/slug.ts src/lib/slug.test.ts src/components/admin/POIForm.tsx src/app/admin/collections/page.tsx
git commit -m "fix: generate schema-compliant ids"
```

---

### Task 6: Preserve Collection Creation Audit Fields on Update

**Files:**
- Modify: `src/app/admin/collections/page.tsx`
- Test recommended: add E2E or unit coverage if extracting save logic is reasonable
- Reference: `firestore.rules`

- [ ] **Step 1: Confirm current risk**

Current `handleSave()` sets `geaendert_von` and `geaendert_am`, but for existing collections it does not explicitly preserve `erstellt_von` and `erstellt_am`. If the edited object lacks those fields, Firestore Rules reject the update because `request.resource.data.erstellt_am == resource.data.erstellt_am` must hold.

- [ ] **Step 2: Preserve original audit fields**

When starting edit, the object usually includes original metadata. Make the save path defensive:

```ts
if (_isNew) {
  docData.erstellt_von = user?.email ?? 'unbekannt'
  docData.erstellt_am = now
} else {
  const original = collections.find((col) => col.id === id)
  docData.erstellt_von = original?.erstellt_von ?? editing.erstellt_von ?? user?.email ?? 'unbekannt'
  docData.erstellt_am = original?.erstellt_am ?? editing.erstellt_am ?? now
}
```

- [ ] **Step 3: Run relevant tests**

Run:

```bash
npm run test:rules
npm test
```

Expected: pass after Task 2 is complete.

- [ ] **Step 4: If E2E is available, run collection editing spec**

Run:

```bash
npm run test:e2e -- tests/e2e/collections.spec.ts
```

Expected: collection create/edit/delete flows pass against the emulator.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/collections/page.tsx
git commit -m "fix: preserve collection audit metadata"
```

---

### Task 7: Align Admin Dashboard Search and Filters

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `tests/e2e/dashboard.spec.ts`

- [ ] **Step 1: Add E2E expectations for promised behavior**

In `tests/e2e/dashboard.spec.ts`, add a test that searches by ID suffix:

```ts
test('TAB-04: text search filters by id suffix', async ({ page }) => {
  await loginAndWaitForTable(page)

  await page.locator('.admin-search-input').fill('berliner-dom')

  const rows = page.locator('.admin-table tbody tr')
  await expect(rows).toHaveCount(1)
  await expect(rows.first()).toContainText('Berliner Dom')
})
```

- [ ] **Step 2: Implement ID-aware search**

In `src/app/admin/page.tsx`, change search filtering:

```ts
result = result.filter((p) =>
  t(p.name, 'de').toLowerCase().includes(s) ||
  p.id.toLowerCase().includes(s)
)
```

- [ ] **Step 3: Either expose or remove unused filters**

Preferred minimal fix: expose the existing `filterStatus` and `onlyNoCoords` controls because the project description says these filters exist.

Add controls in the toolbar:

```tsx
<div className="admin-filter-group">
  <label className="admin-filter-label">Redaktion</label>
  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
    <option value="">Alle Prüfstände</option>
    <option value="bestätigt">bestätigt</option>
    <option value="prüfen">prüfen</option>
  </select>
</div>

<label className="admin-filter-check">
  <input
    type="checkbox"
    checked={onlyNoCoords}
    onChange={(e) => setOnlyNoCoords(e.target.checked)}
  />
  Ohne Koordinaten
</label>
```

If `admin-filter-check` does not exist in `src/app/admin/admin.css`, add a small style matching the existing toolbar controls.

- [ ] **Step 4: Run dashboard E2E**

Run:

```bash
npm run test:e2e -- tests/e2e/dashboard.spec.ts
```

Expected: dashboard tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/page.tsx src/app/admin/admin.css tests/e2e/dashboard.spec.ts
git commit -m "fix: align admin dashboard filters with ui"
```

---

### Task 8: Final Verification and Documentation Pass

**Files:**
- Modify only if needed: `README.md`
- Modify only if needed: `AGENTS.md`
- Modify only if needed: `docs/schema.md`

- [ ] **Step 1: Run all verification commands**

Run:

```bash
npm test
npm run test:rules
npm run build
```

Expected: all pass.

- [ ] **Step 2: Run E2E suite if emulator/browser runtime is available**

Run:

```bash
npm run test:e2e
```

Expected: all Playwright tests pass. If this is too slow or blocked by environment setup, record the exact blocker in the final handoff.

- [ ] **Step 3: Check docs for required updates**

Update documentation only if implementation changed user-facing workflows or architecture:

- `README.md`: update testing section if `test:rules` command/config explanation changes.
- `AGENTS.md`: update known issues if the deep-link redirect or Leaflet note changes.
- `docs/schema.md`: no update needed if slug generation merely starts conforming to the existing documented rule.

- [ ] **Step 4: Inspect git diff**

Run:

```bash
git diff --stat
git diff --check
```

Expected: no whitespace errors; changes are scoped to plan.

- [ ] **Step 5: Final commit**

```bash
git add README.md AGENTS.md docs/schema.md
git commit -m "docs: update project health fix notes"
```

Only make this commit if documentation files actually changed.

---

## Suggested Execution Order

1. Task 1 and Task 2 first: restore trustworthy test gates.
2. Task 4 and Task 5 next: fix schema drift with small, well-tested helpers.
3. Task 3 next: fix production deep-link behavior.
4. Task 6 and Task 7 next: clean Admin behavior and Firestore audit robustness.
5. Task 8 last: prove the whole project is green.

## Known Constraints

- Do not touch live Firebase data during implementation.
- Use the Firebase Emulator Suite for Rules and E2E tests.
- Keep `docs/schema.md` authoritative.
- Avoid broad UI redesign; this is a project health fix pass.
