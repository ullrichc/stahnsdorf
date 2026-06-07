#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import {
  buildPOIImageStoragePaths,
  fileHash,
  optimizeImage,
  readImageCredit,
  storageMediaUrl,
} from './image-import-utils.mjs';

const DEFAULT_INPUT = 'inputdata/bilder';
const DEFAULT_POI_LIST = 'inputdata/bilder-import-manifest.json';
const DEFAULT_REPORT_JSON = 'inputdata/bilder-import-report.json';
const DEFAULT_REPORT_MD = 'inputdata/bilder-import-report.md';
const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'stahnsdorf-90e03.appspot.com';

const args = parseArgs(process.argv.slice(2));
const apply = args.apply === true;
const force = args.force === true;
const inputDir = args.input ?? DEFAULT_INPUT;
const poiListPath = args['poi-list'] ?? DEFAULT_POI_LIST;
const reportJson = args['report-json'] ?? DEFAULT_REPORT_JSON;
const reportMd = args['report-md'] ?? DEFAULT_REPORT_MD;
const bucketName = args.bucket ?? DEFAULT_BUCKET;

const poiList = JSON.parse(await readFile(poiListPath, 'utf8'));
const rows = flattenRows(poiList, inputDir);
const report = {
  generated_at: new Date().toISOString(),
  mode: apply ? 'apply' : 'dry-run',
  bucket: bucketName,
  source_directory: inputDir,
  poi_list: poiListPath,
  imported: [],
  skipped: [],
  unresolved: [],
  errors: [],
};

let db = null;
let bucket = null;

if (apply) {
  initFirebase();
  db = getFirestore();
  bucket = getStorage().bucket(bucketName);
}

for (const row of rows) {
  if (!row.poiId) {
    report.unresolved.push({
      datei: row.filePath,
      grund: 'Kein vorhandener POI zugeordnet',
      name: row.poiName,
    });
    continue;
  }

  try {
    const hash = await fileHash(row.filePath);
    const paths = buildPOIImageStoragePaths(row.poiId, `${hash.slice(0, 10)}-${row.fileName}`);
    const credit = await readImageCredit(row.filePath);
    const image = {
      datei: storageMediaUrl(bucketName, paths.display),
      storage_pfad: paths.display,
      vorschau_datei: storageMediaUrl(bucketName, paths.thumb),
      vorschau_storage_pfad: paths.thumb,
      nachweis: credit,
      mime_type: 'image/jpeg',
      quelle_datei: row.fileName,
      quelle_hash: hash,
    };

    if (apply) {
      const poiRef = db.collection('pois').doc(row.poiId);
      const snap = await poiRef.get();
      if (!snap.exists) {
        report.unresolved.push({
          datei: row.filePath,
          poi_id: row.poiId,
          grund: 'POI existiert nicht in Firestore',
        });
        continue;
      }

      const current = snap.data()?.bilder ?? [];
      const existingIndex = findExistingImageIndex(current, image);
      if (existingIndex >= 0 && !force) {
        report.skipped.push({ datei: row.filePath, poi_id: row.poiId, grund: 'Bereits vorhanden' });
        continue;
      }

      const optimized = await optimizeImage(row.filePath);
      await bucket.file(paths.display).save(optimized.display.buffer, {
        contentType: 'image/jpeg',
        metadata: { cacheControl: 'public, max-age=31536000' },
      });
      await bucket.file(paths.thumb).save(optimized.thumb.buffer, {
        contentType: 'image/jpeg',
        metadata: { cacheControl: 'public, max-age=31536000' },
      });

      image.breite = optimized.display.width;
      image.hoehe = optimized.display.height;
      image.vorschau_breite = optimized.thumb.width;
      image.vorschau_hoehe = optimized.thumb.height;

      const nextImages = existingIndex >= 0
        ? current.map((existing, index) => (index === existingIndex ? { ...existing, ...image } : existing))
        : [...current, image];

      await poiRef.update({
        bilder: nextImages,
        geaendert_von: 'image-import',
        geaendert_am: FieldValue.serverTimestamp(),
      });
    }

    report.imported.push({
      datei: row.filePath,
      poi_id: row.poiId,
      storage_pfad: image.storage_pfad,
      vorschau_storage_pfad: image.vorschau_storage_pfad,
      nachweis: image.nachweis,
    });
  } catch (err) {
    report.errors.push({
      datei: row.filePath,
      poi_id: row.poiId,
      fehler: err instanceof Error ? err.message : String(err),
    });
  }
}

await mkdir(path.dirname(reportJson), { recursive: true });
await writeFile(reportJson, JSON.stringify(report, null, 2), 'utf8');
await writeFile(reportMd, renderMarkdownReport(report), 'utf8');

console.log(`${apply ? 'Import' : 'Dry-Run'} abgeschlossen.`);
console.log(`Importierbar/importiert: ${report.imported.length}`);
console.log(`Übersprungen: ${report.skipped.length}`);
console.log(`Nicht zuordenbar: ${report.unresolved.length}`);
console.log(`Fehler: ${report.errors.length}`);
console.log(`Report: ${reportJson}`);

function flattenRows(list, inputRoot) {
  return (list.pois ?? []).flatMap((poi) => (poi.bilder ?? []).map((image) => ({
    poiId: poi.vorhandener_poi_id ?? null,
    poiName: poi.vorhandener_poi_name ?? poi.name_natuerlich ?? poi.name_dateiname,
    filePath: image.datei ?? path.join(inputRoot, image.dateiname),
    fileName: image.dateiname ?? path.basename(image.datei),
  })));
}

function hasExistingImage(existingImages, image) {
  return findExistingImageIndex(existingImages, image) >= 0;
}

function findExistingImageIndex(existingImages, image) {
  return existingImages.findIndex((existing) =>
    existing.storage_pfad === image.storage_pfad
    || existing.vorschau_storage_pfad === image.vorschau_storage_pfad
    || existing.quelle_hash === image.quelle_hash
    || existing.quelle_datei === image.quelle_datei
  );
}

function initFirebase() {
  if (getApps().length > 0) return;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    initializeApp({
      credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)),
      storageBucket: bucketName,
    });
    return;
  }

  initializeApp({
    credential: applicationDefault(),
    storageBucket: bucketName,
  });
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

function renderMarkdownReport(data) {
  const lines = [
    '# Bilder-Import Report',
    '',
    `Modus: ${data.mode}`,
    `Erzeugt: ${data.generated_at}`,
    `Bucket: ${data.bucket}`,
    '',
    '| Kategorie | Anzahl |',
    '|---|---:|',
    `| Importierbar/importiert | ${data.imported.length} |`,
    `| Übersprungen | ${data.skipped.length} |`,
    `| Nicht zuordenbar | ${data.unresolved.length} |`,
    `| Fehler | ${data.errors.length} |`,
    '',
  ];

  if (data.unresolved.length > 0) {
    lines.push('## Nicht Zuordenbar', '');
    for (const item of data.unresolved) {
      lines.push(`- ${item.datei}: ${item.grund}`);
    }
    lines.push('');
  }

  if (data.errors.length > 0) {
    lines.push('## Fehler', '');
    for (const item of data.errors) {
      lines.push(`- ${item.datei}: ${item.fehler}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}
