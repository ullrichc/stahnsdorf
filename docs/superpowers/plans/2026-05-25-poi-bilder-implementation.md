# POI-Bilder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Firebase-Storage-backed POI images with import tooling, direct admin upload, and visitor-app rendering.

**Architecture:** Firestore remains the POI content source and stores image metadata in `bilder[]`; Firebase Storage stores optimized display and thumbnail files. Shared image helpers normalize URLs, metadata extraction, filename generation, and browser-side optimization so Admin, visitor UI, and import tooling behave consistently.

**Tech Stack:** Next.js 16 static export, React 18, TypeScript 6, Firebase Firestore/Auth/Storage, Firebase Rules tests, Vitest, Playwright, Node import script.

---

## Relevant Design

Implement against `docs/superpowers/specs/2026-05-25-poi-bilder-design.md`.

Important constraints:

- Original photos stay local.
- Admin upload is direct browser upload.
- Import runs dry by default and writes only with `--apply`.
- New POIs cannot upload images until they have been saved once.
- `datei` is renderable; `storage_pfad` is canonical for new Storage files.
- Existing user/data changes in `data/stahnsdorf-backup-translated.json` are unrelated and must not be reverted.

## File Structure

- Modify `docs/schema.md`: document optional image fields.
- Modify `src/lib/types.ts`: extend `Bild`.
- Modify `src/lib/firebase.ts`: export Firebase Storage and connect Storage emulator.
- Modify `firebase.json`: add Storage rules and emulator config.
- Create `storage.rules`: public read, editor write/delete, path/MIME/size limits.
- Modify `package.json`: add Storage deploy script, import script, image metadata/resize dependencies.
- Create `src/lib/images.ts`: browser-safe image URL, filename, metadata, and upload optimization helpers.
- Create `src/lib/images.test.ts`: unit tests for browser-safe helpers.
- Create `src/components/admin/POIImagesEditor.tsx`: image list, upload, edit, reorder, remove.
- Modify `src/components/admin/POIForm.tsx`: wire image editor into existing form.
- Modify `src/components/admin/BackupRestore.tsx`: preserve image refs and warn that media binaries are not included.
- Modify `src/components/POICard.tsx` and `src/components/POICard.module.css`: first-image thumbnail preview.
- Modify `src/app/poi/[id]/POIDetailContent.tsx` and `src/app/poi/[id]/page.module.css`: image gallery.
- Create `scripts/import-poi-images.mjs`: dry-run/apply import from `inputdata/bilder`.
- Create `scripts/image-import-utils.mjs`: Node-only metadata and resize helpers for the import script.
- Create `tests/rules/storage.rules.test.ts`: Storage rule coverage.
- Extend or create Playwright tests under `tests/e2e/poi-images.spec.ts`.
- Update `README.md` and `AGENTS.md` if Storage/development commands change.

---

### Task 1: Schema, Config, and Dependencies

**Files:**
- Modify: `docs/schema.md`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/firebase.ts`
- Modify: `firebase.json`
- Create: `storage.rules`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/rules/storage.rules.test.ts`

- [ ] **Step 1: Extend the documented Bild schema**

Add optional fields in `docs/schema.md`: `storage_pfad`, `breite`, `hoehe`, `mime_type`, `vorschau_datei`, `vorschau_storage_pfad`, `vorschau_breite`, `vorschau_hoehe`.

- [ ] **Step 2: Extend the TypeScript type**

Update `src/lib/types.ts`:

```ts
export type Bild = {
  datei: string;
  nachweis: string;
  nachweis_url?: string;
  beschriftung?: LocalizedText;
  storage_pfad?: string;
  breite?: number;
  hoehe?: number;
  mime_type?: string;
  vorschau_datei?: string;
  vorschau_storage_pfad?: string;
  vorschau_breite?: number;
  vorschau_hoehe?: number;
};
```

- [ ] **Step 3: Add Firebase Storage initialization**

In `src/lib/firebase.ts`, import `getStorage` and `connectStorageEmulator`, export `storage`, and connect emulator on port `9199` when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'`.

- [ ] **Step 4: Add Storage config**

In `firebase.json`, add:

```json
"storage": {
  "rules": "storage.rules"
}
```

and emulator:

```json
"storage": {
  "port": 9199
}
```

- [ ] **Step 5: Add Storage rules**

Create `storage.rules` with public read under `poi-images/{poiId}/{variant}/{fileName}` and editor-only write/delete using `firestore.exists(/databases/(default)/documents/editors/$(request.auth.token.email))`. Restrict writes to `variant in ['display', 'thumb']`, `request.resource.contentType == 'image/jpeg'`, and a concrete max size such as `10 * 1024 * 1024`.

- [ ] **Step 6: Add dependencies and scripts**

Add browser/Node-compatible metadata/resize dependencies after choosing exact packages. Likely candidates: `browser-image-compression` for browser resize, `exifr` for metadata, and `sharp` for Node import resize. Add scripts:

```json
"deploy:storage": "firebase deploy --only storage",
"deploy:firebase": "firebase deploy --only firestore,storage",
"import:images": "node scripts/import-poi-images.mjs"
```

- [ ] **Step 7: Write Storage rules tests**

Create `tests/rules/storage.rules.test.ts` covering public read, editor write/delete, non-editor denial, wrong path denial, non-image MIME denial, and oversized file denial.

- [ ] **Step 8: Run focused rules tests**

Run: `npm run test:rules`

Expected: storage tests pass. If existing Firestore rules tests fail due unrelated config, capture exact failure before changing scope.

- [ ] **Step 9: Commit**

Commit only files from this task:

```bash
git add docs/schema.md src/lib/types.ts src/lib/firebase.ts firebase.json storage.rules package.json package-lock.json tests/rules/storage.rules.test.ts
git commit -m "feat: configure poi image storage"
```

---

### Task 2: Shared Image Helpers

**Files:**
- Create: `src/lib/images.ts`
- Create: `src/lib/images.test.ts`

- [ ] **Step 1: Write helper tests first**

Cover:

- `normalizeImageFileName('45 Friedhofskapelle.jpg')` returns a stable lowercase ASCII-ish `.jpg` name.
- `buildPOIImageStoragePaths('poi_sws_hauptkapelle', '45 Friedhofskapelle.jpg')` returns display and thumb paths.
- `resolveImageUrl()` preserves `https://` URLs.
- `resolveImageUrl()` prefixes local public paths with the configured base path in production.
- `extractCredit()` uses creator/credit/artist/copyright priority and falls back to `Förderverein Südwestkirchhof Stahnsdorf e.V.`.
- `validateImageFile()` accepts JPEG/PNG within the size limit.
- `validateImageFile()` rejects HEIC, non-images, and oversized files with user-facing German messages.

- [ ] **Step 2: Run helper tests to verify failure**

Run: `npx vitest run src/lib/images.test.ts`

Expected: fail because `src/lib/images.ts` does not exist.

- [ ] **Step 3: Implement helpers**

Implement focused exports:

```ts
export const DEFAULT_IMAGE_CREDIT = 'Förderverein Südwestkirchhof Stahnsdorf e.V.';
export function normalizeImageFileName(name: string): string;
export function buildPOIImageStoragePaths(poiId: string, sourceName: string): { display: string; thumb: string };
export function resolveImageUrl(urlOrPath?: string): string | undefined;
export function extractCredit(metadata: Record<string, unknown>): string;
export async function readBrowserImageMetadata(file: File): Promise<Record<string, unknown>>;
export function validateImageFile(file: File): { ok: true } | { ok: false; message: string };
export async function optimizeImageForUpload(file: File): Promise<{ display: Blob; thumb: Blob; width: number; height: number; thumbWidth: number; thumbHeight: number; mimeType: string }>;
```

Keep this file browser-safe. Do not import `sharp`, `firebase-admin`, or any Node-only module from `src/lib/images.ts`.

- [ ] **Step 4: Run helper tests**

Run: `npx vitest run src/lib/images.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/images.ts src/lib/images.test.ts
git commit -m "feat: add poi image helpers"
```

---

### Task 3: Admin Image Editor

**Files:**
- Create: `src/components/admin/POIImagesEditor.tsx`
- Modify: `src/components/admin/POIForm.tsx`
- Modify: `src/app/admin/admin.css`
- Test: `tests/e2e/poi-images.spec.ts`

- [ ] **Step 1: Add an E2E test for existing image metadata editing**

Seed a POI with two `bilder[]` entries. Verify the Admin form shows thumbnails, lets the user edit `nachweis` and `beschriftung.de`, reorder images, remove one reference without Storage delete, save, and preserves the resulting `bilder[]`.

- [ ] **Step 2: Add an E2E test for new POI upload gating**

Open the new POI form and verify the image upload area says the POI must be saved first, with the upload control disabled.

- [ ] **Step 3: Add upload behavior tests**

Cover:

- JPEG/PNG upload is accepted.
- HEIC and non-image files show a clear German error and do not upload.
- Oversized files show a clear German error and do not upload.
- Browser metadata is read and `nachweis` is prefilled from creator/credit/artist/copyright when present.
- If no usable metadata exists, `nachweis` is `Förderverein Südwestkirchhof Stahnsdorf e.V.`.
- Use explicit test fixtures with known EXIF/IPTC/XMP metadata.
- Assert that image changes for existing POIs are persisted to Firestore immediately, before the general POI save button is used.

- [ ] **Step 4: Run E2E tests to verify failure**

Run: `firebase emulators:exec "npx playwright test tests/e2e/poi-images.spec.ts"`

Expected: fail because the UI does not exist.

- [ ] **Step 5: Build `POIImagesEditor`**

Responsibilities:

- render thumbnails from `vorschau_datei || datei`
- edit `nachweis`, `nachweis_url`, `beschriftung.de`
- move image up/down
- remove image reference
- upload one or more files for existing POIs
- validate MIME type and file size before upload
- read browser metadata and prefill `nachweis`
- apply EXIF orientation during browser optimization
- write display/thumb files to Storage
- get download URLs and append metadata to `bilder[]`
- immediately persist the updated `bilder[]` for existing POIs
- cleanup uploaded files if the immediate Firestore image update fails

- [ ] **Step 6: Wire editor into `POIForm`**

Pass `poiId`, `formData.bilder ?? []`, `setField('bilder', nextImages)`, and the current editor email. For existing POIs, `POIImagesEditor` persists image-only changes immediately with `updateDoc(doc(db, 'pois', poiId), { bilder: nextImages, geaendert_von, geaendert_am })` while also keeping `formData.bilder` synchronized. For new POIs, render disabled explanatory state until save.

- [ ] **Step 7: Add Admin CSS**

Use the existing light admin design system. Keep controls dense and operational: thumbnail grid/list, compact icon buttons, clear upload/progress/error states.

- [ ] **Step 8: Run focused E2E tests**

Run: `firebase emulators:exec "npx playwright test tests/e2e/poi-images.spec.ts"`

Expected: pass, or fail only on known unrelated emulator/test setup issues that are documented.

- [ ] **Step 9: Commit**

```bash
git add src/components/admin/POIImagesEditor.tsx src/components/admin/POIForm.tsx src/app/admin/admin.css tests/e2e/poi-images.spec.ts
git commit -m "feat: manage poi images in admin"
```

---

### Task 4: Visitor Image Rendering

**Files:**
- Modify: `src/components/POICard.tsx`
- Modify: `src/components/POICard.module.css`
- Modify: `src/app/poi/[id]/POIDetailContent.tsx`
- Modify: `src/app/poi/[id]/page.module.css`
- Test: `tests/e2e/poi-images.spec.ts`

- [ ] **Step 1: Add visitor rendering tests**

Seed POIs with no images, one image, and multiple images. Verify no-image layout still works, card uses first thumbnail when present, and detail page renders gallery with captions and credits.

- [ ] **Step 2: Run tests to verify failure**

Run: `firebase emulators:exec "npx playwright test tests/e2e/poi-images.spec.ts"`

Expected: gallery/card assertions fail.

- [ ] **Step 3: Add card preview**

In `POICard.tsx`, choose `poi.bilder?.[0]`, resolve `vorschau_datei || datei`, and render a stable preview area when present.

- [ ] **Step 4: Add detail gallery**

In `POIDetailContent.tsx`, render all `bilder[]` after the description or before sources. Show image, localized caption when available, and `nachweis`/`nachweis_url`.

- [ ] **Step 5: Add responsive CSS**

Use stable aspect ratios, avoid layout shifts, and ensure credits do not overlap images or controls.

- [ ] **Step 6: Run visitor tests and build**

Run:

```bash
firebase emulators:exec "npx playwright test tests/e2e/poi-images.spec.ts"
npm run build
```

Expected: focused tests pass; build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/POICard.tsx src/components/POICard.module.css src/app/poi/[id]/POIDetailContent.tsx src/app/poi/[id]/page.module.css tests/e2e/poi-images.spec.ts
git commit -m "feat: show poi images to visitors"
```

---

### Task 5: Import Script

**Files:**
- Create: `scripts/import-poi-images.mjs`
- Create: `scripts/image-import-utils.mjs`
- Modify: `package.json`
- Test: `tests/import-poi-images.test.mjs`

- [ ] **Step 1: Write import tests**

Test dry-run behavior, metadata priority, credit fallback, duplicate detection, stable storage paths, display/thumb variant sizing, report generation, and metadata stripping using fixture files or mocked image metadata/storage/firestore adapters.

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run tests/import-poi-images.test.mjs`

Expected: fail because script does not exist.

- [ ] **Step 3: Implement script structure**

CLI behavior:

```bash
npm run import:images
npm run import:images -- --apply
npm run import:images -- --input inputdata/bilder --poi-list inputdata/bilder-poi-liste.json
```

Dry-run writes a report only. `--apply` uploads display/thumb files and updates POI `bilder[]`.

- [ ] **Step 4: Implement Node-only import helpers**

Put `sharp`, `firebase-admin`, and any Node-only metadata tooling only in `scripts/import-poi-images.mjs` or `scripts/image-import-utils.mjs`, never in `src/lib/images.ts`. Helpers must produce display/thumb JPEGs, apply image orientation, remove GPS/original EXIF from optimized output, and return width/height metadata.

- [ ] **Step 5: Implement idempotency**

Before appending, load existing `bilder[]` and skip when `storage_pfad`, `vorschau_storage_pfad`, normalized source filename, or source hash already exists.

- [ ] **Step 6: Preserve audit fields**

When updating Firestore through Admin SDK, preserve `erstellt_von` and `erstellt_am`; set `geaendert_von` to `image-import` and update `geaendert_am`.

- [ ] **Step 7: Run import tests**

Run: `npx vitest run tests/import-poi-images.test.mjs`

Expected: pass.

- [ ] **Step 8: Run a real dry-run**

Run: `npm run import:images`

Expected: report lists importable, skipped, and unresolved files; no Firestore or Storage writes.

- [ ] **Step 9: Commit**

```bash
git add scripts/import-poi-images.mjs scripts/image-import-utils.mjs tests/import-poi-images.test.mjs package.json package-lock.json
git commit -m "feat: import poi images from local photos"
```

---

### Task 6: Backup, Restore, and Documentation

**Files:**
- Modify: `src/components/admin/BackupRestore.tsx`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/schema.md`

- [ ] **Step 1: Add backup UI note**

Clarify in the Admin backup view that JSON backup contains image references, not binary Storage files.

- [ ] **Step 2: Preserve image references**

Verify export/restore keeps all `bilder[]` fields including optional Storage and preview fields. Add validation only if current runtime validation drops or rejects the new fields.

- [ ] **Step 3: Update docs**

Update setup and deployment docs for Firebase Storage, `npm run deploy:storage`, `npm run deploy:firebase`, Storage emulator, and `npm run import:images`.

- [ ] **Step 4: Run relevant tests**

Run:

```bash
firebase emulators:exec "npx playwright test tests/e2e/backup.spec.ts"
npm run build
```

If this command shape is wrong for the current test setup, use the project-equivalent focused test command and document it in the final notes.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/BackupRestore.tsx README.md AGENTS.md docs/schema.md
git commit -m "docs: document poi image storage workflow"
```

---

### Task 7: Final Verification

**Files:**
- No new files unless failures reveal necessary fixes.

- [ ] **Step 1: Run unit tests**

Run: `npm run test`

Expected: pass, except known pre-existing failures must be explicitly identified with exact file/test names.

- [ ] **Step 2: Run rules tests**

Run: `npm run test:rules`

Expected: pass for Firestore and Storage rules.

- [ ] **Step 3: Run E2E tests**

Run: `npm run test:e2e`

Expected: pass, or document unrelated pre-existing failures.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: static export succeeds.

- [ ] **Step 5: Manual smoke test**

Start dev server and verify:

- Admin existing POI shows images area.
- New POI image upload is disabled until save.
- Existing POI can upload an image to emulator Storage.
- Visitor card and detail page show uploaded image.

- [ ] **Step 6: Final commit if needed**

Commit any final fixes with a narrow message.
