import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BACKUP = 'data/stahnsdorf-backup-translated.json';

export function inferCoordinateSource(poi) {
  if (!poi?.koordinaten) return null;

  const quellen = poi.quellen ?? [];
  const text = [...quellen, poi.notiz ?? ''].join('\n');
  const osmSource = quellen.find((source) => /OpenStreetMap|OSM/i.test(source));
  if (osmSource || /OSM-Koordinate übernommen/i.test(text)) {
    return {
      typ: 'osm',
      beleg: shortOSMBeleg(osmSource ?? text),
      datum: extractFetchedDate(osmSource ?? text),
      genauigkeit: 'hoch',
    };
  }

  const wsrSource = quellen.find((source) => /wo-sie-ruhen\.de/i.test(source));
  if (wsrSource && /API-Extraktion/i.test(wsrSource) && /Neu aus wo-sie-ruhen\.de API/i.test(text)) {
    return {
      typ: 'wo-sie-ruhen',
      beleg: 'wo-sie-ruhen.de API-Extraktion 2026-04-04',
      datum: extractDate(wsrSource) ?? '2026-04-04',
      genauigkeit: 'hoch',
    };
  }

  if (/Kamera-EXIF|EXIF/i.test(text)) {
    return {
      typ: 'manuell-kamera',
      beleg: 'Kamera-EXIF aus lokalem Bildimport',
      genauigkeit: 'mittel',
    };
  }

  if (/Bestandskoordinate aus der Ausgangsdatei übernommen/i.test(text)) {
    return {
      typ: 'altbestand',
      beleg: 'Ausgangsdatei vor strukturierter Quellenpflege',
      genauigkeit: 'niedrig',
    };
  }

  return {
    typ: 'unbekannt',
    beleg: 'Koordinate vorhanden, Herkunft im Altbestand nicht strukturiert dokumentiert',
    genauigkeit: 'niedrig',
  };
}

export function extractLagehinweis(note = '') {
  const lageLautMatch = note.match(/Lage laut wo-sie-ruhen\.de:\s*(.+?)(?:\s+OSM-Koordinate übernommen|$)/i);
  if (lageLautMatch?.[1]) {
    return {
      lagehinweis: cleanLage(lageLautMatch[1]),
      lagehinweis_quelle: 'wo-sie-ruhen.de',
    };
  }

  const apiMatch = note.match(/Neu aus wo-sie-ruhen\.de API\.\s*Lage:\s*(.+?)(?:\.\s*Ehrengrab|\.$|$)/i);
  if (apiMatch?.[1]) {
    return {
      lagehinweis: cleanLage(apiMatch[1]),
      lagehinweis_quelle: 'wo-sie-ruhen.de',
    };
  }

  return null;
}

export function backfillCoordinateMetadata(backup) {
  const result = structuredClone(backup);
  result.pois = (result.pois ?? []).map((poi) => {
    const updated = { ...poi };
    const source = inferCoordinateSource(updated);
    if (source) {
      updated.koordinaten_quelle = source;
    } else {
      delete updated.koordinaten_quelle;
    }

    const lage = extractLagehinweis(updated.notiz ?? '');
    if (lage) {
      updated.lagehinweis = lage.lagehinweis;
      updated.lagehinweis_quelle = lage.lagehinweis_quelle;
    }

    return updated;
  });

  return result;
}

function shortOSMBeleg(text) {
  const explicit = text.match(/OpenStreetMap:\s*(node|way|relation)\s+(\d+)/i);
  if (explicit) {
    return `OpenStreetMap: ${explicit[1].toLowerCase()} ${explicit[2]}`;
  }

  const note = text.match(/OSM-Koordinate übernommen \((node|way|relation)\s+(\d+)\)/i);
  if (note) {
    return `OpenStreetMap: ${note[1].toLowerCase()} ${note[2]}`;
  }

  return 'OpenStreetMap';
}

function extractFetchedDate(text) {
  return text.match(/abgerufen\s+(\d{4}-\d{2}-\d{2})/i)?.[1] ?? extractDate(text);
}

function extractDate(text) {
  return text.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
}

function cleanLage(value) {
  return value.trim().replace(/\s+/g, ' ').replace(/\.$/, '');
}

function parseArgs(argv) {
  const args = { backup: DEFAULT_BACKUP };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--backup') args.backup = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const backupPath = path.resolve(args.backup);
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const updated = backfillCoordinateMetadata(backup);
  fs.writeFileSync(backupPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');

  const withSources = updated.pois.filter((poi) => poi.koordinaten_quelle).length;
  const withLage = updated.pois.filter((poi) => poi.lagehinweis).length;
  console.log(`Updated ${backupPath}`);
  console.log(`Coordinate sources: ${withSources}`);
  console.log(`Location hints: ${withLage}`);
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main();
}
