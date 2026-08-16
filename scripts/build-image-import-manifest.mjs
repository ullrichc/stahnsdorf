#!/usr/bin/env node
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import exifr from 'exifr';

const args = parseArgs(process.argv.slice(2));
const oldManifestPath = args['old-manifest'] ?? 'inputdata/bilder-poi-liste.json';
const inputDirectory = args.input ?? 'inputdata/0606bilder';
const backupPath = args.backup ?? 'data/stahnsdorf-backup-translated.json';
const outputPath = args.output ?? 'inputdata/bilder-import-manifest.json';

const NAME_OVERRIDES = new Map([
  ['anita krahn', 'Anita Kupsch'],
  ['eingang', 'Haupteingang'],
  ['englischer soldatenfriedhof', 'Berlin South-Western Cemetery'],
  ['erik jan hanussen steinschneider', 'Erik Jan Hanussen'],
  ['garnisonsgrab', 'Garnisongrab'],
  ['heldenblock', 'Heldenblock / Deutscher Ehrenblock'],
  ['karl ludwig manzel', 'Karl Ludwig Manzel'],
  ['prof dr med paul manteufel', 'Paul Manteufel'],
]);

const MANUAL_POI_MATCHES = new Map([
  ['03', 'poi_sws_hermann-boost'],
  ['05', 'poi_sws_familie-schulte-schwarzer-engel'],
  ['20', 'poi_sws_wilhelm-groener'],
  ['21', 'poi_sws_louis-meyer'],
  ['28', 'poi_sws_reinhold-felderhoff'],
  ['34', 'poi_sws_arne-elsholtz'],
  ['43', 'poi_sws_guenther-heidemann'],
  ['47', 'poi_sws_kurt-kroner'],
  ['56', 'poi_sws_hanno-guenther'],
]);

const MANUAL_IMAGE_FILE_RENAMES = new Map([
  ['inputdata/bilder/21 Meyer, Louise.jpg', 'inputdata/bilder/21 Meyer, Louis.jpg'],
  ['inputdata/bilder/21a Meyer, Louise.jpg', 'inputdata/bilder/21a Meyer, Louis.jpg'],
]);

const IMAGE_CREDIT_OVERRIDES = new Map([
  ['66 Alte Umbettung.JPG', 'Lars Uhlemann'],
  ['72 Mausoleum Caspary.JPG', 'Lars Uhlemann'],
]);

const oldManifest = JSON.parse(await readFile(oldManifestPath, 'utf8'));
const backup = JSON.parse(await readFile(backupPath, 'utf8'));
const pois = backup.pois ?? [];
const poiById = new Map(pois.map((poi) => [poi.id, poi]));
const existingSourceDirectories = oldManifest.source_directories
  ?? [oldManifest.source_directory].filter(Boolean);

if (existingSourceDirectories.includes(inputDirectory)) {
  throw new Error(`Bildordner ${inputDirectory} wurde bereits importiert.`);
}

const newFiles = (await readdir(inputDirectory))
  .filter((file) => /\.jpe?g$/i.test(file))
  .sort((a, b) => a.localeCompare(b, 'de', { numeric: true }));

const groups = new Map();
for (const fileName of newFiles) {
  const plan = parsePlanNumber(fileName);
  if (!plan) continue;
  if (!groups.has(plan)) groups.set(plan, []);
  groups.get(plan).push(fileName);
}

const generatedPois = [];
for (const [plan, files] of groups) {
  const firstFile = files[0];
  const rawName = parseName(firstFile);
  const canonicalName = NAME_OVERRIDES.get(normalize(rawName)) ?? rawName;
  const poi = findPOI(canonicalName);
  if (!poi) {
    throw new Error(`Kein POI fuer "${rawName}" gefunden.`);
  }

  const bilder = [];
  for (const fileName of files) {
    const filePath = path.join(inputDirectory, fileName).replaceAll('\\', '/');
    const fileStat = await stat(filePath);
    const metadata = await exifr.parse(filePath, { gps: true, tiff: true, exif: true }).catch(() => ({}));

    bilder.push({
      datei: filePath,
      dateiname: fileName,
      nachweis: IMAGE_CREDIT_OVERRIDES.get(fileName),
      variante: parseVariant(fileName),
      gps: metadata?.latitude && metadata?.longitude ? {
        lat: round(metadata.latitude),
        lng: round(metadata.longitude),
        altitude: metadata.altitude ?? null,
      } : null,
      aufnahmezeit: formatDate(metadata?.DateTimeOriginal ?? metadata?.CreateDate),
      bytes: fileStat.size,
      breite: metadata?.ExifImageWidth ?? metadata?.ImageWidth ?? null,
      hoehe: metadata?.ExifImageHeight ?? metadata?.ImageHeight ?? null,
      baumnummerAusDateiname: parseTreeNumber(fileName),
      nichtAufPlanAusDateiname: /nicht\s+auf\s+Plan/i.test(fileName),
    });
  }

  generatedPois.push({
    plan_nummer: plan,
    name_dateiname: rawName,
    name_natuerlich: canonicalName,
    typ_hinweis: null,
    baumnummern: [...new Set(bilder.map((bild) => bild.baumnummerAusDateiname).filter(Boolean))],
    nicht_auf_papierlageplan: bilder.some((bild) => bild.nichtAufPlanAusDateiname),
    vorhandener_poi_id: poi.id,
    vorhandener_poi_name: poi.name?.de ?? canonicalName,
    koordinaten_primär: null,
    koordinaten_mittelwert: null,
    gps_bilder: bilder.filter((bild) => bild.gps).length,
    bilder_gesamt: bilder.length,
    aufnahmezeit_von: minDateString(bilder.map((bild) => bild.aufnahmezeit).filter(Boolean)),
    aufnahmezeit_bis: maxDateString(bilder.map((bild) => bild.aufnahmezeit).filter(Boolean)),
    kamera: 'samsung Galaxy S24 Ultra',
    software: 'S928BXXS6DZE1',
    bilder,
  });
}

const output = {
  ...oldManifest,
  generated_at: new Date().toISOString(),
  source_manifests: [...new Set([...(oldManifest.source_manifests ?? []), oldManifestPath])],
  source_directories: [...new Set([...existingSourceDirectories, inputDirectory])],
  poi_count: (oldManifest.pois ?? []).length + generatedPois.length,
  image_count: (oldManifest.image_count ?? countImages(oldManifest)) + generatedPois.reduce((sum, poi) => sum + poi.bilder.length, 0),
  pois: [...applyManualPOIMatches(oldManifest.pois ?? []), ...generatedPois],
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

console.log(`Manifest geschrieben: ${outputPath}`);
console.log(`Neue POI-Gruppen: ${generatedPois.length}`);
console.log(`Neue Bilder: ${generatedPois.reduce((sum, poi) => sum + poi.bilder.length, 0)}`);
console.log(`Gesamtbilder: ${output.image_count}`);

function parsePlanNumber(fileName) {
  return fileName.match(/^(\d+)/)?.[1] ?? null;
}

function parseVariant(fileName) {
  return fileName.match(/^\d+([a-z])\s+/i)?.[1] ?? 'hauptbild';
}

function parseName(fileName) {
  return fileName
    .replace(/\.jpe?g$/i, '')
    .replace(/^\d+[a-z]?\s+/i, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTreeNumber(fileName) {
  return fileName.match(/Baumnummer\s+(\d+)/i)?.[1] ?? null;
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function findPOI(name) {
  const normalizedName = normalize(name);
  return pois.find((poi) => normalize(poi.name?.de ?? '') === normalizedName);
}

function applyManualPOIMatches(oldPois) {
  return oldPois.map((manifestPoi) => {
    const poiId = MANUAL_POI_MATCHES.get(manifestPoi.plan_nummer);
    if (!poiId) return manifestPoi;

    const poi = poiById.get(poiId);
    if (!poi) {
      throw new Error(`Manuelles POI-Mapping ${manifestPoi.plan_nummer} verweist auf unbekannten POI ${poiId}.`);
    }

    return {
      ...manifestPoi,
      vorhandener_poi_id: poi.id,
      vorhandener_poi_name: poi.name?.de ?? manifestPoi.vorhandener_poi_name ?? manifestPoi.name_natuerlich,
      bilder: (manifestPoi.bilder ?? []).map(applyManualImageFileRename),
    };
  });
}

function applyManualImageFileRename(image) {
  const nextPath = MANUAL_IMAGE_FILE_RENAMES.get(image.datei);
  if (!nextPath) return image;

  return {
    ...image,
    datei: nextPath,
    dateiname: path.basename(nextPath),
  };
}

function round(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function formatDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function minDateString(values) {
  return values.length ? [...values].sort()[0] : null;
}

function maxDateString(values) {
  return values.length ? [...values].sort().at(-1) : null;
}

function countImages(manifest) {
  return (manifest.pois ?? []).reduce((sum, poi) => sum + (poi.bilder ?? []).length, 0);
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
