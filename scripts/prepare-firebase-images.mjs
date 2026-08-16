#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildPOIImageStoragePaths,
  fileHash,
  optimizeImage,
  resolveImageCredit,
  storageMediaUrl,
} from './image-import-utils.mjs';

const DEFAULT_MANIFEST = 'inputdata/bilder-import-manifest.json';
const DEFAULT_OUT_DIR = 'inputdata/firebase-bilder';
const DEFAULT_REPORT = 'inputdata/firebase-bilder-manifest.json';
const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'stahnsdorf-90e03.firebasestorage.app';

const args = parseArgs(process.argv.slice(2));
const manifestPath = args.manifest ?? DEFAULT_MANIFEST;
const outDir = args.out ?? DEFAULT_OUT_DIR;
const reportPath = args.report ?? DEFAULT_REPORT;
const bucketName = args.bucket ?? DEFAULT_BUCKET;

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const rows = flattenRows(manifest);
const prepared = [];
const unresolved = [];
const errors = [];

for (const row of rows) {
  if (!row.poiId) {
    unresolved.push({
      quelle_datei: row.filePath,
      grund: 'Kein vorhandener POI zugeordnet',
      name: row.poiName,
    });
    continue;
  }

  try {
    const hash = await fileHash(row.filePath);
    const paths = buildPOIImageStoragePaths(row.poiId, `${hash.slice(0, 10)}-${row.fileName}`);
    const optimized = await optimizeImage(row.filePath);
    const credit = await resolveImageCredit(row.filePath, row.credit);
    const displayOut = path.join(outDir, paths.display);
    const thumbOut = path.join(outDir, paths.thumb);

    await mkdir(path.dirname(displayOut), { recursive: true });
    await mkdir(path.dirname(thumbOut), { recursive: true });
    await writeFile(displayOut, optimized.display.buffer);
    await writeFile(thumbOut, optimized.thumb.buffer);

    prepared.push({
      poi_id: row.poiId,
      poi_name: row.poiName,
      quelle_datei: row.filePath,
      quelle_hash: hash,
      nachweis: credit,
      datei: storageMediaUrl(bucketName, paths.display),
      storage_pfad: paths.display,
      breite: optimized.display.width,
      hoehe: optimized.display.height,
      vorschau_datei: storageMediaUrl(bucketName, paths.thumb),
      vorschau_storage_pfad: paths.thumb,
      vorschau_breite: optimized.thumb.width,
      vorschau_hoehe: optimized.thumb.height,
      lokale_anzeige_datei: displayOut.replaceAll('\\', '/'),
      lokale_vorschau_datei: thumbOut.replaceAll('\\', '/'),
    });
  } catch (err) {
    errors.push({
      quelle_datei: row.filePath,
      poi_id: row.poiId,
      fehler: err instanceof Error ? err.message : String(err),
    });
  }
}

const report = {
  generated_at: new Date().toISOString(),
  manifest: manifestPath,
  output_directory: outDir,
  bucket: bucketName,
  prepared_count: prepared.length,
  unresolved_count: unresolved.length,
  error_count: errors.length,
  prepared,
  unresolved,
  errors,
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`Firebase-Bildordner geschrieben: ${outDir}`);
console.log(`Vorbereitet: ${prepared.length}`);
console.log(`Nicht zuordenbar: ${unresolved.length}`);
console.log(`Fehler: ${errors.length}`);
console.log(`Report: ${reportPath}`);

function flattenRows(list) {
  return (list.pois ?? []).flatMap((poi) => (poi.bilder ?? []).map((image) => ({
    poiId: poi.vorhandener_poi_id ?? null,
    poiName: poi.vorhandener_poi_name ?? poi.name_natuerlich ?? poi.name_dateiname,
    filePath: image.datei,
    fileName: image.dateiname ?? path.basename(image.datei),
    credit: image.nachweis,
  })));
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
      i++;
    }
  }
  return parsed;
}
