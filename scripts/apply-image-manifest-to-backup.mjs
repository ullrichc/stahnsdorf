#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_BACKUP = 'data/stahnsdorf-backup-translated.json';
const DEFAULT_MANIFEST = 'inputdata/firebase-bilder-manifest.json';

const args = parseArgs(process.argv.slice(2));
const backupPath = args.backup ?? DEFAULT_BACKUP;
const manifestPath = args.manifest ?? DEFAULT_MANIFEST;
const dryRun = args.apply !== true;

const backup = JSON.parse(await readFile(backupPath, 'utf8'));
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const prepared = manifest.prepared ?? [];
const imagesByPoi = groupImagesByPoi(prepared);

const stats = {
  manifest_images: prepared.length,
  affected_pois: imagesByPoi.size,
  updated_pois: 0,
  added_images: 0,
  replaced_images: 0,
  missing_pois: [],
};

const pois = backup.pois ?? [];

for (const poi of pois) {
  const manifestImages = imagesByPoi.get(poi.id);
  if (!manifestImages) continue;

  const currentImages = Array.isArray(poi.bilder) ? poi.bilder : [];
  const nextImages = [...currentImages];

  for (const image of manifestImages) {
    const existingIndex = nextImages.findIndex((existing) => imageMatches(existing, image));
    if (existingIndex >= 0) {
      nextImages[existingIndex] = { ...nextImages[existingIndex], ...image };
      stats.replaced_images += 1;
    } else {
      nextImages.push(image);
      stats.added_images += 1;
    }
  }

  poi.bilder = nextImages;
  stats.updated_pois += 1;
}

const poiIds = new Set(pois.map((poi) => poi.id));
for (const poiId of imagesByPoi.keys()) {
  if (!poiIds.has(poiId)) stats.missing_pois.push(poiId);
}

if (!dryRun) {
  await writeFile(backupPath, `${JSON.stringify(backup, null, 2)}\n`, 'utf8');
}

console.log(`${dryRun ? 'Dry-Run' : 'Backup aktualisiert'}: ${backupPath}`);
console.log(`Manifestbilder: ${stats.manifest_images}`);
console.log(`Betroffene POIs: ${stats.affected_pois}`);
console.log(`Aktualisierte POIs: ${stats.updated_pois}`);
console.log(`Neue Bildreferenzen: ${stats.added_images}`);
console.log(`Ersetzte Bildreferenzen: ${stats.replaced_images}`);
console.log(`Fehlende POIs: ${stats.missing_pois.length}`);
if (stats.missing_pois.length > 0) {
  console.log(stats.missing_pois.join('\n'));
  process.exitCode = 1;
}

function groupImagesByPoi(rows) {
  const grouped = new Map();
  for (const row of rows) {
    if (!row.poi_id) continue;
    const image = toBackupImage(row);
    const list = grouped.get(row.poi_id) ?? [];
    list.push(image);
    grouped.set(row.poi_id, list);
  }
  return grouped;
}

function toBackupImage(row) {
  return cleanObject({
    datei: row.datei,
    storage_pfad: row.storage_pfad,
    breite: row.breite,
    hoehe: row.hoehe,
    mime_type: 'image/jpeg',
    vorschau_datei: row.vorschau_datei,
    vorschau_storage_pfad: row.vorschau_storage_pfad,
    vorschau_breite: row.vorschau_breite,
    vorschau_hoehe: row.vorschau_hoehe,
    nachweis: row.nachweis,
    quelle_datei: row.quelle_datei ? path.basename(row.quelle_datei) : undefined,
    quelle_hash: row.quelle_hash,
  });
}

function imageMatches(existing, image) {
  return Boolean(
    (existing.quelle_hash && existing.quelle_hash === image.quelle_hash)
      || (existing.storage_pfad && existing.storage_pfad === image.storage_pfad)
      || (existing.datei && existing.datei === image.datei),
  );
}

function cleanObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ''),
  );
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}
