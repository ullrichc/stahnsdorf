# Merge Scraping Data into POIs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge 27 high-quality POIs from wo-sie-ruhen.de scraping (with exact GPS coordinates) into the existing `data/pois.json`, conforming strictly to the schema in `docs/schema.md`.

**Architecture:** A Node.js merge script reads `data/pois.json` (base), `input/pois_ergaenzt.json` (enrichments), and `scraping/stahnsdorf_map_pois.json` (GPS source of truth). It produces an updated `data/pois.json` with coordinates filled in and 4 new POIs added. Collections are updated for ID renames. Everything stays in the original schema (`typ`, `koordinaten`, `kurztext`, `beschreibung`, etc.).

**Tech Stack:** Node.js (no dependencies), Vitest for tests

---

## Situation Analysis

### Data Sources (priority order)

| # | Source | File | POIs | With GPS | Schema |
|---|--------|------|------|----------|--------|
| 1 | **Scraping** (highest quality) | `scraping/stahnsdorf_map_pois.json` | 27 | 27 (100%) | Custom |
| 2 | **Current data** (base) | `data/pois.json` | 71 | 12 | `docs/schema.md` ✓ |
| 3 | **Input enriched** (earlier search) | `input/pois_ergaenzt.json` | 71 | 12 | Extended (different!) |

### Key Findings

**ID Mapping — Scraping → Existing POIs (23 matches, 4 new):**

| Scraping Name | API ID | Existing POI ID | Action |
|---|---|---|---|
| Ernst Gennat | 367 | `ernst-gennat` | Add coords, fix ID |
| Edmund Rumpler | 369 | `poi_sws_edmund-rumpler` | Add coords |
| Alexander von Kluck | 371 | `poi_sws_alexander-von-kluck` | Add coords |
| Karl Ludwig Manzel | 373 | `poi_sws_karl-ludwig-manzel` | Add coords |
| Carl Ludwig Schleich | 375 | `poi_sws_carl-ludwig-schleich` | Add coords |
| Engelbert Humperdinck | 376 | `engelbert-humperdinck` | Update coords, fix ID |
| Gustav Kadelburg | 377 | `poi_sws_gustav-kadelburg` | Add coords |
| Friedrich Wilhelm Murnau | 378 | `fw-murnau` | Update coords, fix ID |
| Ernst Werner von Siemens | 379 | `werner-von-siemens` | Update coords, fix ID |
| Hermann O.J. Wissinger | 380 | `poi_sws_julius-wissinger` | Add coords |
| Lovis Corinth | 381 | `lovis-corinth` | Update coords, fix ID |
| Max Jordan | 382 | `poi_sws_max-jordan` | Add coords |
| Adolf Bastian | 383 | `poi_sws_adolf-bastian` | Add coords |
| Hugo Conwentz | 384 | `poi_sws_hugo-conwentz` | Add coords |
| Reinhold Felderhoff | 385 | — | **NEW POI** |
| Elisabeth von Ardenne | 386 | `poi_sws_elisabeth-von-ardenne` | Add coords |
| Rudolf Breitscheid | 387 | `poi_sws_rudolf-breitscheid` | Add coords |
| Adolf Karl Rohrbach | 388 | `poi_sws_adolf-rohrbach` | Add coords |
| Gustav Langenscheidt | 389 | `poi_sws_gustav-langenscheidt` | Add coords |
| Julius C. Schaarwächter | 390 | — | **NEW POI** |
| Ferdinand von Richthofen | 391 | `poi_sws_ferdinand-von-richthofen` | Add coords |
| Heinrich Zille | 392 | `heinrich-zille` | Update coords, fix ID |
| Wilhelm Kuhnert | 393 | `poi_sws_wilhelm-kuhnert` | Add coords |
| Hans Henrik von Essen | 394 | — | **NEW POI** |
| Emil Krebs | 395 | `poi_sws_emil-krebs` | Add coords |
| Ernst Seger | 396 | — | **NEW POI** |
| Jan Erik Hanussen | 397 | `poi_sws_erik-jan-hanussen` | Add coords |

**Non-standard IDs to rename (11 POIs):**

| Old ID | New ID |
|--------|--------|
| `engelbert-humperdinck` | `poi_sws_engelbert-humperdinck` |
| `ernst-gennat` | `poi_sws_ernst-gennat` |
| `hauptkapelle` | `poi_sws_hauptkapelle` |
| `fw-murnau` | `poi_sws_fw-murnau` |
| `friedhofseingang` | `poi_sws_friedhofseingang` |
| `heinrich-zille` | `poi_sws_heinrich-zille` |
| `hugo-distler` | `poi_sws_hugo-distler` |
| `joachim-gottschalk` | `poi_sws_joachim-gottschalk` |
| `lovis-corinth` | `poi_sws_lovis-corinth` |
| `theodor-fontane-jun` | `poi_sws_theodor-fontane-jun` |
| `werner-von-siemens` | `poi_sws_werner-von-siemens` |

**Existing POIs that already have GPS (12) — scraping provides higher-quality coords for 6 of them:**
- `ernst-gennat`, `engelbert-humperdinck`, `fw-murnau`, `werner-von-siemens`, `lovis-corinth`, `heinrich-zille` → **Replace** with scraping coords (higher quality, from official API)
- `hauptkapelle`, `friedhofseingang`, `hugo-distler`, `joachim-gottschalk`, `theodor-fontane-jun`, `poi_sws_berlin-south-western-cemetery` → **Keep** existing coords (not in scraping data)

**Status rule:** Any POI with `koordinaten !== null` → `status: "bestätigt"`

### Schema Compliance (`docs/schema.md`)

The output must use exactly these fields:
```
id, typ, name, koordinaten, kurztext, beschreibung, datum_von, datum_bis,
wikipedia_url, bilder, audio, quellen, status, notiz
```

The `input/pois_ergaenzt.json` uses a **different** schema (`type`, `coordinates`, `summary`, `description`, `dates`, `source_refs`, `tags`, etc.) — these field names must NOT appear in the output. The input is only useful for extracting `location_note` content → merge into `notiz`.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `scripts/merge-pois.mjs` | **Create** | Merge script — reads all sources, produces merged output |
| `scripts/id-mapping.mjs` | **Create** | Mapping tables: scraping→existing IDs, old→new ID renames |
| `tests/merge-pois.test.mjs` | **Create** | Tests for merge logic |
| `data/pois.json` | **Modify** | Merged output (75 POIs: 71 existing + 4 new) |
| `data/collections.json` | **Modify** | Update POI ID references after renames, add new POIs to collections |

---

### Task 1: Create ID Mapping Module

**Files:**
- Create: `scripts/id-mapping.mjs`
- Test: `tests/id-mapping.test.mjs`

- [ ] **Step 1: Write the test for scraping-to-existing mapping**

```js
// tests/id-mapping.test.mjs
import { describe, it, expect } from 'vitest';
import { SCRAPING_TO_EXISTING, ID_RENAMES, applyRenames } from '../scripts/id-mapping.mjs';

describe('SCRAPING_TO_EXISTING', () => {
  it('maps all 23 matching scraping IDs to existing POI IDs', () => {
    expect(Object.keys(SCRAPING_TO_EXISTING)).toHaveLength(23);
    expect(SCRAPING_TO_EXISTING['367']).toBe('ernst-gennat'); // pre-rename ID
    expect(SCRAPING_TO_EXISTING['376']).toBe('engelbert-humperdinck'); // pre-rename ID
    expect(SCRAPING_TO_EXISTING['378']).toBe('fw-murnau'); // pre-rename ID
    expect(SCRAPING_TO_EXISTING['383']).toBe('poi_sws_adolf-bastian');
  });

  it('does not include the 4 new POIs', () => {
    expect(SCRAPING_TO_EXISTING['385']).toBeUndefined(); // Felderhoff
    expect(SCRAPING_TO_EXISTING['390']).toBeUndefined(); // Schaarwächter
    expect(SCRAPING_TO_EXISTING['394']).toBeUndefined(); // von Essen
    expect(SCRAPING_TO_EXISTING['396']).toBeUndefined(); // Seger
  });
});

describe('ID_RENAMES', () => {
  it('maps 11 non-standard IDs to poi_sws_ convention', () => {
    expect(Object.keys(ID_RENAMES)).toHaveLength(11);
    expect(ID_RENAMES['ernst-gennat']).toBe('poi_sws_ernst-gennat');
    expect(ID_RENAMES['fw-murnau']).toBe('poi_sws_fw-murnau');
    expect(ID_RENAMES['hauptkapelle']).toBe('poi_sws_hauptkapelle');
  });
});

describe('applyRenames', () => {
  it('renames IDs in a POI array', () => {
    const pois = [
      { id: 'ernst-gennat', name: { de: 'Test' } },
      { id: 'poi_sws_emil-krebs', name: { de: 'Test2' } },
    ];
    const result = applyRenames(pois);
    expect(result[0].id).toBe('poi_sws_ernst-gennat');
    expect(result[1].id).toBe('poi_sws_emil-krebs'); // unchanged
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/id-mapping.test.mjs`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the mapping module**

```js
// scripts/id-mapping.mjs

// Scraping API ID → existing POI ID (before renames)
// 23 matches out of 27 scraping POIs
export const SCRAPING_TO_EXISTING = {
  '367': 'ernst-gennat',               // Ernst Gennat
  '369': 'poi_sws_edmund-rumpler',      // Edmund Rumpler
  '371': 'poi_sws_alexander-von-kluck', // Alexander von Kluck
  '373': 'poi_sws_karl-ludwig-manzel',  // Karl Ludwig Manzel
  '375': 'poi_sws_carl-ludwig-schleich',// Carl Ludwig Schleich
  '376': 'engelbert-humperdinck',       // Engelbert Humperdinck
  '377': 'poi_sws_gustav-kadelburg',    // Gustav Kadelburg
  '378': 'fw-murnau',                   // Friedrich Wilhelm Murnau
  '379': 'werner-von-siemens',          // Werner von Siemens
  '380': 'poi_sws_julius-wissinger',    // Hermann O.J. Wissinger
  '381': 'lovis-corinth',              // Lovis Corinth
  '382': 'poi_sws_max-jordan',          // Max Jordan
  '383': 'poi_sws_adolf-bastian',       // Adolf Bastian
  '384': 'poi_sws_hugo-conwentz',       // Hugo Conwentz
  '386': 'poi_sws_elisabeth-von-ardenne',// Elisabeth von Ardenne
  '387': 'poi_sws_rudolf-breitscheid',  // Rudolf Breitscheid
  '388': 'poi_sws_adolf-rohrbach',       // Adolf Rohrbach
  '389': 'poi_sws_gustav-langenscheidt', // Langenscheidt
  '391': 'poi_sws_ferdinand-von-richthofen', // Richthofen
  '392': 'heinrich-zille',              // Zille
  '393': 'poi_sws_wilhelm-kuhnert',     // Kuhnert
  '395': 'poi_sws_emil-krebs',          // Krebs
  '397': 'poi_sws_erik-jan-hanussen',   // Hanussen
};

// 4 new POIs from scraping that don't exist in current data
export const NEW_SCRAPING_IDS = ['385', '390', '394', '396'];

// Old non-standard ID → new poi_sws_ ID
export const ID_RENAMES = {
  'engelbert-humperdinck': 'poi_sws_engelbert-humperdinck',
  'ernst-gennat': 'poi_sws_ernst-gennat',
  'hauptkapelle': 'poi_sws_hauptkapelle',
  'fw-murnau': 'poi_sws_fw-murnau',
  'friedhofseingang': 'poi_sws_friedhofseingang',
  'heinrich-zille': 'poi_sws_heinrich-zille',
  'hugo-distler': 'poi_sws_hugo-distler',
  'joachim-gottschalk': 'poi_sws_joachim-gottschalk',
  'lovis-corinth': 'poi_sws_lovis-corinth',
  'theodor-fontane-jun': 'poi_sws_theodor-fontane-jun',
  'werner-von-siemens': 'poi_sws_werner-von-siemens',
};

// Apply ID renames to a POI array (returns new array, does not mutate)
export function applyRenames(pois) {
  return pois.map(poi => {
    const newId = ID_RENAMES[poi.id];
    return newId ? { ...poi, id: newId } : poi;
  });
}

// Apply ID renames inside collections' pois arrays
export function applyRenamesInCollections(collections) {
  return collections.map(col => ({
    ...col,
    pois: col.pois.map(id => ID_RENAMES[id] || id),
  }));
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run tests/id-mapping.test.mjs`

- [ ] **Step 5: Commit**

```bash
git add scripts/id-mapping.mjs tests/id-mapping.test.mjs
git commit -m "feat: add ID mapping tables for scraping-to-existing POI merge"
```

---

### Task 2: Create Merge Script — Core Logic

**Files:**
- Create: `scripts/merge-pois.mjs`
- Test: `tests/merge-pois.test.mjs`

- [ ] **Step 1: Write tests for merge logic**

```js
// tests/merge-pois.test.mjs
import { describe, it, expect } from 'vitest';
import { mergeCoordinates, createNewPoi, buildMergedPois } from '../scripts/merge-pois.mjs';

describe('mergeCoordinates', () => {
  it('adds coordinates from scraping to a POI without coords', () => {
    const poi = { id: 'poi_sws_edmund-rumpler', koordinaten: null, status: 'prüfen', notiz: '' };
    const scraping = { latitude: 52.38845, longitude: 13.18757, location_note: 'Block Reformation' };
    const result = mergeCoordinates(poi, scraping);
    expect(result.koordinaten).toEqual({ lat: 52.38845, lng: 13.18757 });
    expect(result.status).toBe('bestätigt');
  });

  it('overwrites existing coords with scraping coords (higher quality)', () => {
    const poi = { id: 'poi_sws_ernst-gennat', koordinaten: { lat: 52.388, lng: 13.188 }, status: 'bestätigt', notiz: '' };
    const scraping = { latitude: 52.38852, longitude: 13.18782, location_note: 'Block Reformation' };
    const result = mergeCoordinates(poi, scraping);
    expect(result.koordinaten.lat).toBe(52.38852);
    expect(result.koordinaten.lng).toBe(13.18782);
  });

  it('appends lage info to notiz if not already present', () => {
    const poi = { id: 'test', koordinaten: null, status: 'prüfen', notiz: 'Existing note.' };
    const scraping = { latitude: 52.0, longitude: 13.0, location_note: 'Block Trinitatis, Feld 21' };
    const result = mergeCoordinates(poi, scraping);
    expect(result.notiz).toContain('Block Trinitatis, Feld 21');
    expect(result.notiz).toContain('Existing note.');
  });

  it('sets status to bestätigt when coordinates are added', () => {
    const poi = { id: 'test', koordinaten: null, status: 'prüfen', notiz: '' };
    const scraping = { latitude: 52.0, longitude: 13.0, location_note: '' };
    const result = mergeCoordinates(poi, scraping);
    expect(result.status).toBe('bestätigt');
  });

  it('handles null notiz safely', () => {
    const poi = { id: 'test', koordinaten: null, status: 'prüfen', notiz: null };
    const scraping = { latitude: 52.0, longitude: 13.0, location_note: 'Block X' };
    const result = mergeCoordinates(poi, scraping);
    expect(result.notiz).toContain('Block X');
  });
});

describe('createNewPoi', () => {
  it('creates a valid POI from scraping data following docs/schema.md', () => {
    const scraping = {
      id: '385',
      name: 'Reinhold Carl Thusmann Felderhoff',
      vorname: 'Reinhold Carl Thusmann',
      nachname: 'Felderhoff',
      beruf: 'Professor, Bildhauer, Graphiker',
      latitude: 52.387747,
      longitude: 13.177103,
      location_note: 'Block Trinitatis, Feld 10, Wahlstelle 64',
      ehrengrab: false,
    };
    const poi = createNewPoi(scraping);
    expect(poi.id).toBe('poi_sws_reinhold-felderhoff');
    expect(poi.typ).toBe('grab');
    expect(poi.koordinaten).toEqual({ lat: 52.387747, lng: 13.177103 });
    expect(poi.status).toBe('bestätigt');
    expect(poi.name.de).toBe('Reinhold Carl Thusmann Felderhoff');
    expect(poi.kurztext.de).toContain('Felderhoff');
    expect(poi.beschreibung.de).toContain('Felderhoff');
    expect(poi.bilder).toEqual([]);
    expect(poi.audio).toEqual({});
    expect(poi.quellen).toContain('wo-sie-ruhen.de, Südwestkirchhof Stahnsdorf, API-Extraktion 2026-04-04');
  });
});

describe('buildMergedPois', () => {
  it('returns 75 POIs (71 existing + 4 new)', () => {
    // This test uses the real files
    const result = buildMergedPois();
    expect(result).toHaveLength(75);
  });

  it('all POIs with koordinaten have status bestätigt', () => {
    const result = buildMergedPois();
    const withCoords = result.filter(p => p.koordinaten !== null);
    withCoords.forEach(p => {
      expect(p.status).toBe('bestätigt');
    });
  });

  it('all IDs follow poi_sws_ convention', () => {
    const result = buildMergedPois();
    result.forEach(p => {
      expect(p.id).toMatch(/^poi_sws_/);
    });
  });

  it('existing POIs with GPS not in scraping retain their coordinates', () => {
    const result = buildMergedPois();
    const kapelle = result.find(p => p.id === 'poi_sws_hauptkapelle');
    expect(kapelle.koordinaten).not.toBeNull();
    const eingang = result.find(p => p.id === 'poi_sws_friedhofseingang');
    expect(eingang.koordinaten).not.toBeNull();
  });

  it('no duplicate IDs', () => {
    const result = buildMergedPois();
    const ids = result.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('output POIs only have schema-conformant fields', () => {
    const VALID_FIELDS = new Set([
      'id', 'typ', 'name', 'koordinaten', 'kurztext', 'beschreibung',
      'datum_von', 'datum_bis', 'wikipedia_url', 'bilder', 'audio',
      'quellen', 'status', 'notiz',
    ]);
    const result = buildMergedPois();
    result.forEach(p => {
      Object.keys(p).forEach(key => {
        expect(VALID_FIELDS.has(key)).toBe(true);
      });
    });
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run tests/merge-pois.test.mjs`

- [ ] **Step 3: Implement merge-pois.mjs**

The script must:

1. Read `data/pois.json` (base, 71 POIs, correct schema)
2. Read `scraping/stahnsdorf_map_pois.json` (27 POIs with exact GPS)
3. Build a lookup: scraping API ID → scraping entry
4. For each base POI:
   - Look up matching scraping entry via `SCRAPING_TO_EXISTING`
   - If found: merge coordinates, update lage in notiz, set `status: "bestätigt"`
   - Apply ID renames (non-standard → `poi_sws_` convention)
   - Ensure only `docs/schema.md` fields are present
5. For 4 new scraping POIs (`NEW_SCRAPING_IDS`):
   - Create new POIs with all required schema fields
   - German text only (en/fr left for later AI generation)
6. For existing POIs already with GPS but NOT in scraping:
   - Keep existing coords, set `status: "bestätigt"`
7. Sort output by `id` alphabetically
8. Write to `data/pois.json`

Key implementation details for `mergeCoordinates`:
```js
export function mergeCoordinates(poi, scraping) {
  const result = { ...poi };
  result.koordinaten = { lat: scraping.latitude, lng: scraping.longitude };
  result.status = 'bestätigt';

  // Append lage info to notiz if useful and not already there
  const lage = scraping.location_note;
  const notiz = result.notiz || '';
  if (lage && !notiz.includes(lage)) {
    const prefix = notiz ? notiz.replace(/\s*$/, '') + ' ' : '';
    result.notiz = prefix + 'Lage laut wo-sie-ruhen.de: ' + lage;
  }
  return result;
}
```

Key helper for slug generation:
```js
// Transliterate German characters and build a URL-safe slug
export function generateSlug(nachname, vorname) {
  // Use first "given" name + last name, e.g. "Reinhold Felderhoff"
  const firstName = vorname.split(' ')[0].toLowerCase();
  const lastName = nachname.toLowerCase();
  const raw = firstName + '-' + lastName;
  return raw
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
// Expected slugs for 4 new POIs:
//   385: reinhold-felderhoff
//   390: julius-schaarwaechter
//   394: hans-von-essen
//   396: ernst-seger
```

Key implementation details for `createNewPoi`:
```js
export function createNewPoi(scraping) {
  const slug = generateSlug(scraping.nachname, scraping.vorname);
  return {
    id: 'poi_sws_' + slug,
    typ: 'grab',
    name: { de: scraping.name },
    koordinaten: { lat: scraping.latitude, lng: scraping.longitude },
    kurztext: { de: `Grab von ${scraping.name}; ${scraping.beruf}.` },
    beschreibung: { de: `${scraping.name} – ${scraping.beruf}. Die Grabstätte befindet sich im ${scraping.location_note} des Südwestkirchhofs Stahnsdorf.` },
    datum_von: null,
    datum_bis: null,
    wikipedia_url: null,
    bilder: [],
    audio: {},
    quellen: ['wo-sie-ruhen.de, Südwestkirchhof Stahnsdorf, API-Extraktion 2026-04-04'],
    status: 'bestätigt',
    notiz: `Neu aus wo-sie-ruhen.de API. Lage: ${scraping.location_note}. Ehrengrab: ${scraping.ehrengrab ? 'ja' : 'nein'}. Biografische Daten und Übersetzungen noch ergänzen.`,
  };
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run tests/merge-pois.test.mjs`

- [ ] **Step 5: Commit**

```bash
git add scripts/merge-pois.mjs tests/merge-pois.test.mjs
git commit -m "feat: merge script to integrate scraping GPS data into pois.json"
```

---

### Task 3: Update Collections for ID Renames + New POIs

**Files:**
- Modify: `scripts/merge-pois.mjs` (add collection update)
- Test: `tests/merge-pois.test.mjs` (add collection tests)

- [ ] **Step 1: Write collection merge tests**

```js
describe('mergeCollections', () => {
  it('renames all non-standard IDs in pois arrays', () => {
    const collections = [
      { id: 'col1', pois: ['ernst-gennat', 'poi_sws_emil-krebs', 'fw-murnau'] },
    ];
    const result = applyRenamesInCollections(collections);
    expect(result[0].pois).toEqual([
      'poi_sws_ernst-gennat',
      'poi_sws_emil-krebs',
      'poi_sws_fw-murnau',
    ]);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Add collection update logic to merge script**

The merge script's main function should also:
1. Read `data/collections.json`
2. Apply `applyRenamesInCollections`
3. Optionally add new POIs to relevant collections (manual decision — flag in output)
4. Write updated `data/collections.json`

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add scripts/merge-pois.mjs tests/merge-pois.test.mjs
git commit -m "feat: update collections for ID renames"
```

---

### Task 4: Run the Merge and Validate Output

**Files:**
- Modify: `data/pois.json` (merged output)
- Modify: `data/collections.json` (updated IDs)

- [ ] **Step 1: Run the merge script**

```bash
node scripts/merge-pois.mjs
```

- [ ] **Step 2: Validate output — counts**

```bash
node -e "
const p = require('./data/pois.json');
const c = require('./data/collections.json');
const withGPS = p.filter(x => x.koordinaten !== null);
const confirmed = p.filter(x => x.status === 'bestätigt');
const allPoiswPrefix = p.every(x => x.id.startsWith('poi_sws_'));
console.log('POIs:', p.length, '(expected: 75)');
console.log('With GPS:', withGPS.length, '(expected: 33)');
console.log('Bestätigt:', confirmed.length);
console.log('All poi_sws_:', allPoiswPrefix);
// Check no extended-schema fields leaked in
const BAD = ['type','coordinates','summary','description','dates','source_refs','tags','categories'];
const leaked = p.filter(x => BAD.some(f => f in x));
console.log('Schema violations:', leaked.length, '(expected: 0)');
"
```

Expected output:
- 75 POIs total (71 + 4 new)
- ~31 with GPS (12 existing + 19 new from scraping that didn't have coords before)
- Actually: 27 scraping matches (23 existing + 4 new), of which 6 already had coords → 12 - 6 + 27 = 33 with GPS, but 6 non-scraping POIs keep their coords → **33 total with GPS**
- All IDs start with `poi_sws_`
- 0 schema violations

- [ ] **Step 3: Validate — spot check coordinates**

```bash
node -e "
const p = require('./data/pois.json');
// Spot checks
const bastian = p.find(x => x.id === 'poi_sws_adolf-bastian');
console.log('Bastian coords:', bastian.koordinaten); // {lat: 52.38673, lng: 13.17995}
const murnau = p.find(x => x.id === 'poi_sws_fw-murnau');
console.log('Murnau coords:', murnau.koordinaten);   // {lat: 52.38820, lng: 13.18389}
const felderhoff = p.find(x => x.id.includes('felderhoff'));
console.log('Felderhoff (new):', felderhoff?.id, felderhoff?.koordinaten);
"
```

- [ ] **Step 4: Validate — collections integrity**

```bash
node -e "
const p = require('./data/pois.json');
const c = require('./data/collections.json');
const poiIds = new Set(p.map(x => x.id));
const missing = c.flatMap(col => col.pois).filter(id => !poiIds.has(id));
console.log('Broken collection refs:', missing.length, missing);
const nonStd = c.flatMap(col => col.pois).filter(id => !id.startsWith('poi_sws_'));
console.log('Non-standard IDs in collections:', nonStd.length);
"
```

- [ ] **Step 5: Commit merged data**

```bash
git add data/pois.json data/collections.json
git commit -m "data: merge 27 scraping POIs with GPS coordinates, fix IDs, add 4 new POIs"
```

---

### Task 5: Cleanup and Documentation

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

- [ ] **Step 2: Add merge summary to notiz of scraping report**

Update `scraping/stahnsdorf_map_report.md` with a section documenting the merge result:
- How many coords added
- Which POIs are new
- Which IDs were renamed

- [ ] **Step 3: Final commit**

```bash
git add scraping/stahnsdorf_map_report.md
git commit -m "docs: update scraping report with merge results"
```

---

## Expected Final State

| Metric | Before | After |
|--------|--------|-------|
| Total POIs | 71 | 75 |
| POIs with GPS | 12 | 33 |
| POIs bestätigt | varies | all with GPS |
| Non-standard IDs | 11 | 0 |
| Schema violations | 0 | 0 |
| New POIs | — | Felderhoff, Schaarwächter, von Essen, Seger |

## Risks and Decisions

1. **Coordinate precision:** Scraping data has 5-6 decimal places. The existing `lovis-corinth` has only 3 (`52.391, 13.176`) — scraping provides `52.38764, 13.17958`. These differ significantly (~270m). The scraping coords from the official API are more trustworthy → replace.

2. **4 new POIs lack biographical data:** Only `name`, `beruf`, and `lage` from scraping. Mark with `notiz` flag for manual enrichment.

3. **Ehrengrab info:** The scraping `ehrengrab` field (0/1) is captured in `notiz` for the 4 new POIs and could be added to existing POIs' `notiz` as well. The schema has no dedicated ehrengrab field.

4. **Input enrichments discarded:** The `input/pois_ergaenzt.json` extended-schema fields (`tags`, `categories`, `source_refs`, `primary_person`, etc.) are NOT carried forward since they don't exist in `docs/schema.md`. If you want these fields, the schema needs to be updated first.

5. **wo-sie-ruhen.de `lage` detail:** The scraping provides much more detailed lage info (e.g., "Block Trinitatis, Feld 21, Wahlgrabstelle 153/154") than what's currently in `notiz`. This gets appended to `notiz`.
