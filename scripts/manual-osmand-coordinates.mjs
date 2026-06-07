import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BACKUP = 'data/stahnsdorf-backup-translated.json';
const DEFAULT_INPUT = 'inputdata/neue_Koordinaten_über_OSM.txt';
const DEFAULT_DATE = '2026-06-06';
const DEFAULT_TIMESTAMP = '2026-06-06T00:00:00.000Z';
const PROTECTED_SOURCE_TYPES = new Set(['osm', 'wo-sie-ruhen']);

const ID_ALIASES = new Map([
  ['walter-gropius', 'poi_sws_walter-gropius-senior'],
  ['theodor-fontane', 'poi_sws_theodor-fontane-jun'],
  ['wilhelm-groener', 'poi_sws_wilhelm-groener'],
  ['erik-jan-hannusen-steinschneider', 'poi_sws_erik-jan-hanussen'],
  ['friedrich-wilhelm-murnau', 'poi_sws_fw-murnau'],
  ['ralph-arthur-roberts-schoenherr', 'poi_sws_ralph-arthur-roberts'],
  ['friedhofskapelle', 'poi_sws_hauptkapelle'],
]);

const NEW_MANUAL_POI_DETAILS = {
  'hermann-boost': {
    id: 'poi_sws_hermann-boost',
    name: {
      de: 'Hermann Boost',
      en: 'Hermann Boost',
      fr: 'Hermann Boost',
      pl: 'Hermann Boost',
      ru: 'Герман Бост',
      sv: 'Hermann Boost',
    },
    kurztext: {
      de: 'Grab von Hermann Boost auf dem Südwestkirchhof Stahnsdorf.',
      en: 'Grave of Hermann Boost at the South-Western Cemetery in Stahnsdorf.',
      fr: 'Tombe de Hermann Boost au cimetière du Sud-Ouest à Stahnsdorf.',
      pl: 'Grób Hermanna Boosta na Cmentarzu Południowo-Zachodnim w Stahnsdorfie.',
      ru: 'Могила Германа Боста на Юго-Западном кладбище в Штансдорфе.',
      sv: 'Grav för Hermann Boost på Südwestkirchhof i Stahnsdorf.',
    },
  },
  'fam-schulte-schwarzer-engel': {
    id: 'poi_sws_familie-schulte-schwarzer-engel',
    name: {
      de: 'Familie Schulte (Schwarzer Engel)',
      en: 'Schulte family (Black Angel)',
      fr: 'Famille Schulte (Ange noir)',
      pl: 'Rodzina Schulte (Czarny Anioł)',
      ru: 'Семья Шульте (Чёрный ангел)',
      sv: 'Familjen Schulte (Svarta ängeln)',
    },
    kurztext: {
      de: 'Grab der Familie Schulte mit dem Schwarzen Engel.',
      en: 'Grave of the Schulte family with the Black Angel.',
      fr: 'Tombe de la famille Schulte avec l’Ange noir.',
      pl: 'Grób rodziny Schulte z Czarnym Aniołem.',
      ru: 'Могила семьи Шульте с Чёрным ангелом.',
      sv: 'Grav för familjen Schulte med Svarta ängeln.',
    },
  },
};

const MANUAL_SOURCE = 'Manuelle GPS-Erfassung via OsmAnd: inputdata/neue_Koordinaten_über_OSM.txt';

export function parseManualOSMAndCoordinates(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const entries = [];

  for (let index = 0; index < lines.length - 1; index += 1) {
    const locationMatch = lines[index + 1].match(/^Standort:\s*geo:([-0-9.]+),([-0-9.]+)/i);
    if (!locationMatch) continue;

    const url = lines[index + 2]?.startsWith('https://osmand.net/') ? lines[index + 2] : null;
    entries.push({
      name: lines[index],
      koordinaten: {
        lat: Number(locationMatch[1]),
        lng: Number(locationMatch[2]),
      },
      url,
    });
    index += url ? 2 : 1;
  }

  return entries;
}

export function applyManualOSMAndCoordinates(backup, entries, options = {}) {
  const datum = options.datum ?? DEFAULT_DATE;
  const timestamp = options.timestamp ?? DEFAULT_TIMESTAMP;
  const result = structuredClone(backup);
  result.pois = result.pois ?? [];

  const poiById = new Map(result.pois.map((poi) => [poi.id, poi]));
  const poiBySlug = buildPoiSlugIndex(result.pois);
  const summary = {
    parsed: entries.length,
    updated: [],
    protected: [],
    added: [],
    unmatched: [],
  };

  for (const entry of entries) {
    const match = findExistingPoi(entry, poiById, poiBySlug);
    if (match) {
      if (PROTECTED_SOURCE_TYPES.has(match.koordinaten_quelle?.typ)) {
        summary.protected.push({ name: entry.name, id: match.id, typ: match.koordinaten_quelle.typ });
        continue;
      }

      updateExistingPOI(match, entry, { datum, timestamp });
      summary.updated.push({ name: entry.name, id: match.id });
      continue;
    }

    const newPoi = createNewManualPOI(entry, { datum, timestamp });
    if (!newPoi) {
      summary.unmatched.push(entry.name);
      continue;
    }

    if (poiById.has(newPoi.id)) {
      const existing = poiById.get(newPoi.id);
      if (PROTECTED_SOURCE_TYPES.has(existing.koordinaten_quelle?.typ)) {
        summary.protected.push({ name: entry.name, id: existing.id, typ: existing.koordinaten_quelle.typ });
        continue;
      }
      updateExistingPOI(existing, entry, { datum, timestamp });
      summary.updated.push({ name: entry.name, id: existing.id });
      continue;
    }

    result.pois.push(newPoi);
    poiById.set(newPoi.id, newPoi);
    poiBySlug.set(slug(newPoi.name.de), newPoi);
    poiBySlug.set(newPoi.id.replace(/^poi_sws_/, ''), newPoi);
    summary.added.push({ name: entry.name, id: newPoi.id });
  }

  result._timestamp = timestamp;
  Object.defineProperty(result, 'manualOSMAndSummary', {
    value: summary,
    enumerable: false,
  });
  return result;
}

function buildPoiSlugIndex(pois) {
  const index = new Map();
  for (const poi of pois) {
    if (poi.name?.de) index.set(slug(poi.name.de), poi);
    index.set(poi.id.replace(/^poi_sws_/, ''), poi);
  }
  return index;
}

function findExistingPoi(entry, poiById, poiBySlug) {
  const entrySlug = slug(entry.name);
  const aliasId = ID_ALIASES.get(entrySlug);
  if (aliasId && poiById.has(aliasId)) return poiById.get(aliasId);

  const exact = poiBySlug.get(entrySlug);
  if (exact) return exact;

  const tokens = entrySlug.split('-').filter((token) => token.length > 2);
  if (tokens.length < 2) return null;

  const candidates = [...poiBySlug.entries()]
    .filter(([candidateSlug]) => tokens.every((token) => candidateSlug.includes(token)))
    .map(([, poi]) => poi);

  return candidates.length === 1 ? candidates[0] : null;
}

function updateExistingPOI(poi, entry, { datum, timestamp }) {
  poi.koordinaten = entry.koordinaten;
  poi.koordinaten_quelle = coordinateSource(entry, datum);
  poi.status = 'bestätigt';
  poi.quellen = appendUnique(poi.quellen ?? [], sourceLine(entry));
  poi.notiz = appendNote(
    poi.notiz ?? '',
    'Manuelle OsmAnd-Koordinate aus inputdata/neue_Koordinaten_über_OSM.txt übernommen.'
  );
  if ('geaendert_am' in poi) poi.geaendert_am = timestamp;
  if ('geaendert_von' in poi) poi.geaendert_von = 'system';
}

function createNewManualPOI(entry, { datum, timestamp }) {
  const details = NEW_MANUAL_POI_DETAILS[slug(entry.name)];
  if (!details) return null;

  return {
    id: details.id,
    typ: 'grab',
    name: details.name,
    koordinaten: entry.koordinaten,
    koordinaten_quelle: coordinateSource(entry, datum),
    kurztext: details.kurztext,
    beschreibung: buildManualDescription(details.name),
    datum_von: null,
    datum_bis: null,
    wikipedia_url: null,
    bilder: [],
    audio: {},
    quellen: [sourceLine(entry)],
    status: 'bestätigt',
    notiz: 'Aus manueller OsmAnd-Koordinatendatei übernommen.',
    publish_status: 'veröffentlicht',
    erstellt_von: 'system',
    geaendert_von: 'system',
    erstellt_am: timestamp,
    geaendert_am: timestamp,
  };
}

function coordinateSource(entry, datum) {
  return {
    typ: 'manuell-osmand',
    beleg: `inputdata/neue_Koordinaten_über_OSM.txt: ${entry.name}`,
    datum,
    genauigkeit: 'hoch',
  };
}

function sourceLine(entry) {
  return [MANUAL_SOURCE, entry.name, entry.url].filter(Boolean).join(', ');
}

function buildManualDescription(name) {
  return {
    de: `${name.de} ist eine vor Ort manuell per OsmAnd verzeichnete Grabstätte auf dem Südwestkirchhof Stahnsdorf.`,
    en: `${name.en} is a grave at the South-Western Cemetery in Stahnsdorf, recorded manually on site with OsmAnd.`,
    fr: `${name.fr} est une tombe du cimetière du Sud-Ouest à Stahnsdorf, relevée manuellement sur place avec OsmAnd.`,
    pl: `${name.pl} to grób na Cmentarzu Południowo-Zachodnim w Stahnsdorfie, ręcznie zarejestrowany w terenie za pomocą OsmAnd.`,
    ru: `${name.ru} — могила на Юго-Западном кладбище в Штансдорфе, вручную зафиксированная на месте с помощью OsmAnd.`,
    sv: `${name.sv} är en grav på Südwestkirchhof i Stahnsdorf, manuellt registrerad på plats med OsmAnd.`,
  };
}

function appendUnique(list = [], value) {
  if (!value) return list;
  return list.includes(value) ? list : [...list, value];
}

function appendNote(note = '', addition) {
  if (!addition || note.includes(addition)) return note;
  return note ? `${note} ${addition}` : addition;
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseArgs(argv) {
  const args = {
    backup: DEFAULT_BACKUP,
    input: DEFAULT_INPUT,
    datum: DEFAULT_DATE,
    timestamp: DEFAULT_TIMESTAMP,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--backup') args.backup = argv[++index];
    else if (arg === '--input') args.input = argv[++index];
    else if (arg === '--datum') args.datum = argv[++index];
    else if (arg === '--timestamp') args.timestamp = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const backupPath = path.resolve(args.backup);
  const inputPath = path.resolve(args.input);
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const input = fs.readFileSync(inputPath, 'utf8');
  const entries = parseManualOSMAndCoordinates(input);
  const updated = applyManualOSMAndCoordinates(backup, entries, args);

  fs.writeFileSync(backupPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  console.log(`Updated ${backupPath}`);
  console.log(`Parsed: ${updated.manualOSMAndSummary.parsed}`);
  console.log(`Updated existing: ${updated.manualOSMAndSummary.updated.length}`);
  console.log(`Protected skipped: ${updated.manualOSMAndSummary.protected.length}`);
  console.log(`Added new: ${updated.manualOSMAndSummary.added.length}`);
  if (updated.manualOSMAndSummary.unmatched.length) {
    console.log(`Unmatched skipped: ${updated.manualOSMAndSummary.unmatched.join(', ')}`);
  }
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main();
}
