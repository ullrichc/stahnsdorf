/**
 * Migrationsscript: Altes POI-Schema → Neues Schema (docs/schema.md)
 *
 * Liest:  input/pois_ergaenzt.json + input/collections_ergaenzt.json
 * Schreibt: data/pois.json + data/collections.json
 *
 * Ausführen: npx tsx scripts/migrate.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// --- Type-Mapping ---

const typeMap: Record<string, string> = {
  grave: 'grab',
  mausoleum: 'mausoleum',
  memorial: 'denkmal',
  monument: 'denkmal',
  building: 'bauwerk',
  section: 'bereich',
  landmark: 'bauwerk',
};

function mapType(oldType: string): string {
  return typeMap[oldType] || oldType;
}

function mapStatus(oldStatus: string): string {
  if (oldStatus === 'bestätigt') return 'bestätigt';
  return 'prüfen'; // unsicher, prüfen → prüfen
}

// --- Source Refs → quellen (Freitext) ---

function formatSource(ref: any): string {
  const parts: string[] = [];
  if (ref.title) parts.push(ref.title);
  if (ref.publisher && ref.publisher !== ref.title) parts.push(ref.publisher);
  if (ref.url) parts.push(ref.url);
  if (ref.accessed) parts.push(`abgerufen ${ref.accessed}`);
  return parts.join(', ');
}

// --- Wikipedia-URL extrahieren ---

function extractWikipediaUrl(sourceRefs: any[]): string | null {
  if (!sourceRefs) return null;
  const wiki = sourceRefs.find(
    (ref: any) => ref.type === 'wikipedia' && ref.url?.includes('wikipedia.org')
  );
  return wiki?.url || null;
}

// --- Notiz zusammenbauen ---

function buildNotiz(old: any): string {
  const parts: string[] = [];

  // Lagehinweis
  if (old.location_note?.de) {
    parts.push(old.location_note.de);
  }

  // Koordinatenstatus
  if (old.coordinates_status === 'approximate') {
    parts.push('Koordinaten nur angenähert.');
  } else if (old.coordinates_status === 'unknown') {
    parts.push('Koordinaten vor Ort ermitteln.');
  }

  // Unsicherheitshinweis
  if (old.uncertainty_note) {
    const note = typeof old.uncertainty_note === 'string'
      ? old.uncertainty_note
      : old.uncertainty_note.de;
    if (note) parts.push(note);
  }

  return parts.join(' ');
}

// --- Koordinaten konvertieren ---

function convertCoordinates(old: any): { lat: number; lng: number } | null {
  if (old.coordinates === null || old.coordinates === undefined) return null;
  if (Array.isArray(old.coordinates)) {
    return { lat: old.coordinates[0], lng: old.coordinates[1] };
  }
  if (typeof old.coordinates === 'object' && old.coordinates.lat !== undefined) {
    return { lat: old.coordinates.lat, lng: old.coordinates.lng };
  }
  return null;
}

// --- POI migrieren ---

function migratePoi(old: any): any {
  const poi: any = {
    id: old.id,
    typ: mapType(old.type),
    name: old.name,
    koordinaten: convertCoordinates(old),
    kurztext: old.summary,
    beschreibung: old.description,
  };

  // Daten: aus primary_person oder dates
  const person = old.primary_person;
  const dates = old.dates;

  const datumVon = person?.birth_date || dates?.born || null;
  const datumBis = person?.death_date || dates?.died || null;
  if (datumVon) poi.datum_von = datumVon;
  if (datumBis) poi.datum_bis = datumBis;

  // Wikipedia
  const wikiUrl = extractWikipediaUrl(old.source_refs);
  if (wikiUrl) poi.wikipedia_url = wikiUrl;

  // Bilder (leer, aber Struktur beibehalten)
  poi.bilder = [];

  // Audio
  poi.audio = {};

  // Quellen
  if (old.source_refs?.length) {
    poi.quellen = old.source_refs.map(formatSource);
  } else {
    poi.quellen = [];
  }

  // Status
  poi.status = mapStatus(old.status);

  // Notiz
  const notiz = buildNotiz(old);
  if (notiz) poi.notiz = notiz;

  return poi;
}

// --- Collection migrieren ---

function migrateCollection(old: any): any {
  const col: any = {
    id: old.id,
    name: old.name,
    kurztext: old.summary,
    beschreibung: old.description,
    pois: old.pois,
    status: mapStatus(old.status),
  };

  const notiz = old.notiz || '';
  if (notiz) col.notiz = notiz;

  return col;
}

// --- Hauptprogramm ---

console.log('Lese Quelldaten...');

const oldPois = JSON.parse(readFileSync(join(root, 'input', 'pois_ergaenzt.json'), 'utf-8'));
const oldCollections = JSON.parse(readFileSync(join(root, 'input', 'collections_ergaenzt.json'), 'utf-8'));

console.log(`  ${oldPois.length} POIs gelesen`);
console.log(`  ${oldCollections.length} Collections gelesen`);

const newPois = oldPois.map(migratePoi);
const newCollections = oldCollections.map(migrateCollection);

// Statistiken
const mitKoordinaten = newPois.filter((p: any) => p.koordinaten !== null).length;
const ohneKoordinaten = newPois.filter((p: any) => p.koordinaten === null).length;
const bestaetigt = newPois.filter((p: any) => p.status === 'bestätigt').length;
const pruefen = newPois.filter((p: any) => p.status === 'prüfen').length;

console.log('\nMigration abgeschlossen:');
console.log(`  ${newPois.length} POIs → data/pois.json`);
console.log(`    davon ${mitKoordinaten} mit Koordinaten, ${ohneKoordinaten} ohne`);
console.log(`    davon ${bestaetigt} bestätigt, ${pruefen} prüfen`);
console.log(`  ${newCollections.length} Collections → data/collections.json`);

writeFileSync(join(root, 'data', 'pois.json'), JSON.stringify(newPois, null, 2), 'utf-8');
writeFileSync(join(root, 'data', 'collections.json'), JSON.stringify(newCollections, null, 2), 'utf-8');

console.log('\nDateien geschrieben. ✓');
