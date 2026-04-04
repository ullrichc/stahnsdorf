// scripts/merge-pois.mjs
// Merges GPS coordinate data from wo-sie-ruhen.de scraping into existing cemetery POI data.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCRAPING_TO_EXISTING, NEW_SCRAPING_IDS, applyRenames, applyRenamesInCollections } from './id-mapping.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const SCHEMA_FIELDS = new Set([
  'id', 'typ', 'name', 'koordinaten', 'kurztext', 'beschreibung',
  'datum_von', 'datum_bis', 'wikipedia_url', 'bilder', 'audio',
  'quellen', 'status', 'notiz',
]);

/** Strip any fields not in docs/schema.md */
function stripToSchema(poi) {
  const result = {};
  for (const key of SCHEMA_FIELDS) {
    if (key in poi) result[key] = poi[key];
  }
  return result;
}

/**
 * Merge GPS coordinates from a scraping entry into an existing POI.
 * Returns a new object (does not mutate).
 */
export function mergeCoordinates(poi, scraping) {
  const result = { ...poi };
  result.koordinaten = { lat: scraping.latitude, lng: scraping.longitude };
  result.status = 'bestätigt';
  const lage = scraping.location_note;
  const notiz = result.notiz || '';
  if (lage && !notiz.includes(lage)) {
    const prefix = notiz ? notiz.replace(/\s*$/, '') + ' ' : '';
    result.notiz = prefix + 'Lage laut wo-sie-ruhen.de: ' + lage;
  }
  return result;
}

/**
 * Generate a URL-safe slug from nachname + vorname.
 * Uses first word of vorname + full nachname, transliterates German characters.
 */
export function generateSlug(nachname, vorname) {
  const firstName = vorname.split(' ')[0].toLowerCase();
  const lastName = nachname.toLowerCase();
  const raw = firstName + '-' + lastName;
  return raw
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Create a new schema-conformant POI from a scraping entry.
 */
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

/**
 * Build the merged POI array. Pure function (reads files but does not write).
 * - Reads data/pois.json (71 base POIs)
 * - Reads scraping/stahnsdorf_map_pois.json (27 scraping entries)
 * - Merges coordinates, applies renames, adds new POIs
 * - Returns sorted array of schema-conformant POIs
 */
export function buildMergedPois() {
  const basePois = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'data', 'pois.json'), 'utf-8'));
  const scrapingData = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'scraping', 'stahnsdorf_map_pois.json'), 'utf-8'));

  // Build lookup: scraping API ID -> scraping entry
  const scrapingById = new Map();
  for (const entry of scrapingData) {
    scrapingById.set(entry.id, entry);
  }

  // Build reverse lookup: existing POI ID -> scraping API ID
  const existingToScrapingId = new Map();
  for (const [scrapingId, existingId] of Object.entries(SCRAPING_TO_EXISTING)) {
    existingToScrapingId.set(existingId, scrapingId);
  }

  // Process existing POIs
  let merged = basePois.map(poi => {
    let result = { ...poi };

    // Look up matching scraping entry
    const scrapingApiId = existingToScrapingId.get(poi.id);
    if (scrapingApiId) {
      const scrapingEntry = scrapingById.get(scrapingApiId);
      if (scrapingEntry) {
        result = mergeCoordinates(result, scrapingEntry);
      }
    } else if (result.koordinaten !== null) {
      // Existing POI with GPS but not in scraping: keep coords, confirm status
      result.status = 'bestätigt';
    }

    return stripToSchema(result);
  });

  // Apply ID renames (non-standard IDs -> poi_sws_ convention)
  merged = applyRenames(merged);

  // Add new POIs from scraping (skip if already present — idempotent)
  const existingIds = new Set(merged.map(p => p.id));
  for (const scrapingId of NEW_SCRAPING_IDS) {
    const scrapingEntry = scrapingById.get(scrapingId);
    if (scrapingEntry) {
      const newPoi = createNewPoi(scrapingEntry);
      if (!existingIds.has(newPoi.id)) {
        merged.push(newPoi);
      }
    }
  }

  // Sort by ID alphabetically
  merged.sort((a, b) => a.id.localeCompare(b.id));

  return merged;
}

/**
 * Build the merged collections array with renamed POI IDs.
 */
export function buildMergedCollections() {
  const collections = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'data', 'collections.json'), 'utf-8'));
  return applyRenamesInCollections(collections);
}

// CLI: node scripts/merge-pois.mjs
if (process.argv[1] && process.argv[1].endsWith('merge-pois.mjs')) {
  const merged = buildMergedPois();
  const outPath = path.resolve(rootDir, 'data', 'pois.json');
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${merged.length} POIs to ${outPath}`);
  const withGPS = merged.filter(p => p.koordinaten !== null).length;
  console.log(`  ${withGPS} with GPS coordinates`);

  const collections = buildMergedCollections();
  const colPath = path.resolve(rootDir, 'data', 'collections.json');
  fs.writeFileSync(colPath, JSON.stringify(collections, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${collections.length} collections to ${colPath}`);
}
