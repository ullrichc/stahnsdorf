import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_INPUT = 'data/stahnsdorf-backup-translated.json';
const DEFAULT_OUTPUT = 'inputdata/osm-poi-candidates.json';
const DEFAULT_REPORT = 'inputdata/osm-poi-candidates.md';
const DEFAULT_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const DEFAULT_BBOX = {
  south: 52.382,
  west: 13.165,
  north: 52.399,
  east: 13.205,
};

const UMLAUTS = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
};

const VALID_FIELDS = new Set([
  'id',
  'typ',
  'name',
  'koordinaten',
  'koordinaten_quelle',
  'lagehinweis',
  'lagehinweis_quelle',
  'kurztext',
  'beschreibung',
  'datum_von',
  'datum_bis',
  'wikipedia_url',
  'bilder',
  'audio',
  'quellen',
  'status',
  'notiz',
]);

export function normalizeName(value = '') {
  return value
    .trim()
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => UMLAUTS[char] ?? char)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeName(value).replace(/\s+/g, '-').replace(/^-|-$/g, '');
}

function normalizeMatchName(value = '') {
  return normalizeName(value)
    .replace(/\b(?:1[5-9][0-9]{2}|20[0-9]{2})\b/g, ' ')
    .replace(/\b(?:grab|grabmal|grabstaette|grabstatte|grabstaetten|familiengrab|familie)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function namesMatch(candidateName, existingName) {
  const candidate = normalizeMatchName(candidateName);
  const existing = normalizeMatchName(existingName);
  if (!candidate || !existing) return false;
  if (candidate === existing) return true;

  const candidateTokens = new Set(candidate.split(' '));
  const existingTokens = new Set(existing.split(' '));
  const smaller = candidateTokens.size < existingTokens.size ? candidateTokens : existingTokens;
  const larger = candidateTokens.size < existingTokens.size ? existingTokens : candidateTokens;
  if (smaller.size < 2) return false;
  return [...smaller].every((token) => [...larger].some((other) => tokensMatch(token, other)));
}

function tokensMatch(a, b) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 5) return false;
  return levenshteinDistance(a, b) <= 1;
}

function levenshteinDistance(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length];
}

function makePOIId(name) {
  const slug = slugify(name) || 'osm-poi';
  return `poi_sws_${slug}`;
}

export function classifyOSMElement(element) {
  const tags = element?.tags ?? {};
  const historic = tags.historic;
  const tomb = tags.tomb;
  const cemetery = tags.cemetery;
  const memorial = tags.memorial;
  const building = tags.building;
  const amenity = tags.amenity;
  const name = normalizeName(tags.name ?? tags['name:de'] ?? '');

  if (tomb === 'mausoleum' || building === 'mausoleum' || name.includes('mausoleum')) {
    return 'mausoleum';
  }

  if (
    historic === 'tomb' ||
    tomb ||
    cemetery === 'grave' ||
    cemetery === 'tomb' ||
    tags.grave
  ) {
    return 'grab';
  }

  if (historic === 'memorial' || memorial) {
    if (['war_memorial', 'memorial_site', 'cemetery', 'victims'].includes(memorial)) {
      return 'gedenkanlage';
    }
    return 'denkmal';
  }

  if (historic === 'monument') {
    return 'denkmal';
  }

  if (
    historic === 'chapel' ||
    building === 'chapel' ||
    building === 'church' ||
    amenity === 'place_of_worship'
  ) {
    return 'bauwerk';
  }

  if (['section', 'sector', 'plot'].includes(cemetery)) {
    return 'bereich';
  }

  return null;
}

function osmUrl(type, id) {
  return `https://www.openstreetmap.org/${type}/${id}`;
}

function getCoordinate(element) {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return { lat: element.lat, lng: element.lon };
  }

  if (typeof element.center?.lat === 'number' && typeof element.center?.lon === 'number') {
    return { lat: element.center.lat, lng: element.center.lon };
  }

  return null;
}

function getCandidateName(element, typ) {
  const tags = element.tags ?? {};
  return (
    tags['name:de'] ||
    tags.name ||
    tags['memorial:name'] ||
    tags.subject ||
    tags.inscription ||
    `${labelForTyp(typ)} (${element.type} ${element.id})`
  );
}

function labelForTyp(typ) {
  return {
    grab: 'Grab',
    mausoleum: 'Mausoleum',
    denkmal: 'Denkmal',
    gedenkanlage: 'Gedenkanlage',
    bauwerk: 'Bauwerk',
    bereich: 'Bereich',
  }[typ] ?? 'OSM-POI';
}

export function wikipediaTagToUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const match = value.match(/^([a-z-]+):(.+)$/i);
  if (!match) return null;
  const [, lang, title] = match;
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
}

export function extractCandidate(element) {
  const typ = classifyOSMElement(element);
  const koordinaten = getCoordinate(element);
  if (!typ || !koordinaten) return null;

  const tags = element.tags ?? {};
  const wikipediaUrl = wikipediaTagToUrl(tags.wikipedia);
  const name = getCandidateName(element, typ);

  return {
    name,
    typ,
    koordinaten,
    normalized_name: normalizeName(name),
    osm: {
      type: element.type,
      id: element.id,
      url: osmUrl(element.type, element.id),
      version: element.version ?? null,
      timestamp: element.timestamp ?? null,
      wikidata: tags.wikidata ?? null,
      wikipedia: tags.wikipedia ?? null,
      wikipediaUrl,
      tags,
    },
  };
}

function normalizeWikipediaUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.hostname.replace(/^m\./, '')}${decodeURIComponent(url.pathname)}`
      .toLowerCase()
      .replace(/\/$/, '');
  } catch {
    return value.toLowerCase().trim();
  }
}

function distanceMeters(a, b) {
  if (!a || !b) return null;
  const radius = 6371000;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const deltaLat = ((b.lat - a.lat) * Math.PI) / 180;
  const deltaLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function matchCandidate(candidate, existingPois) {
  const osmSourceMatch = existingPois.find((existing) => hasOSMSource(existing, candidate));
  if (osmSourceMatch) {
    return matchResult('existing', 'osm_source', osmSourceMatch, candidate);
  }

  const candidateWikipedia = normalizeWikipediaUrl(candidate.osm?.wikipediaUrl);
  if (candidateWikipedia) {
    const poi = existingPois.find((existing) => normalizeWikipediaUrl(existing.wikipedia_url) === candidateWikipedia);
    if (poi) {
      return matchResult('existing', 'wikipedia', poi, candidate);
    }
  }

  const candidateName = normalizeName(candidate.name);
  const nameMatch = existingPois.find((existing) => namesMatch(candidate.name, existing.name?.de));
  if (nameMatch) {
    return matchResult('existing', 'name', nameMatch, candidate);
  }

  const idMatch = existingPois.find((existing) => idMatchesCandidateName(existing.id, candidate.name));
  if (idMatch) {
    return matchResult('existing', 'id', idMatch, candidate);
  }

  const nearbyNameMatch = existingPois
    .map((existing) => ({
      poi: existing,
      name: normalizeName(existing.name?.de),
      distance: distanceMeters(candidate.koordinaten, existing.koordinaten),
    }))
    .filter((entry) => entry.distance !== null && entry.distance <= 20)
    .find((entry) => candidateName.includes(entry.name) || entry.name.includes(candidateName));

  if (nearbyNameMatch) {
    return matchResult('existing', 'nearby_name', nearbyNameMatch.poi, candidate);
  }

  return { kind: 'new', reason: 'no_match' };
}

function hasOSMSource(existing, candidate) {
  const haystack = [
    ...(existing.quellen ?? []),
    existing.koordinaten_quelle?.beleg ?? '',
    existing.notiz ?? '',
  ].join('\n');
  const needles = [
    candidate.osm?.url,
    candidate.osm?.type && candidate.osm?.id ? `OpenStreetMap: ${candidate.osm.type} ${candidate.osm.id}` : null,
    candidate.osm?.type && candidate.osm?.id ? `OSM ${candidate.osm.type} ${candidate.osm.id}` : null,
    candidate.osm?.type && candidate.osm?.id ? `${candidate.osm.type}/${candidate.osm.id}` : null,
  ].filter(Boolean);
  return needles.some((needle) => haystack.includes(needle));
}

function idMatchesCandidateName(existingId, candidateName) {
  const existingSlug = existingId.replace(/^poi_sws_/, '');
  const candidateSlug = slugify(normalizeMatchName(candidateName));
  if (candidateSlug.length < 5) return false;
  return existingSlug.includes(candidateSlug) || candidateSlug.includes(existingSlug);
}

function matchResult(kind, reason, poi, candidate) {
  const distance = distanceMeters(candidate.koordinaten, poi.koordinaten);
  return {
    kind,
    reason,
    poi,
    distance_meters: distance === null ? null : Number(distance.toFixed(1)),
  };
}

function sourceLine(candidate) {
  const bits = [
    `OpenStreetMap: ${candidate.osm.type} ${candidate.osm.id}`,
    candidate.osm.url,
  ];
  if (candidate.osm.version) bits.push(`Version ${candidate.osm.version}`);
  if (candidate.osm.timestamp) bits.push(`Stand ${formatOSMTimestamp(candidate.osm.timestamp)}`);
  return bits.join(', ');
}

function formatOSMTimestamp(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/);
  if (!match) return value;
  const [, year, month, day, hour, minute, second] = match;
  return `${day}.${month}.${year}, ${hour}:${minute}:${second} UTC`;
}

export function createProposedPOI(candidate, fetchedAt) {
  const poi = {
    id: makePOIId(candidate.name),
    typ: candidate.typ,
    name: { de: candidate.name },
    koordinaten: candidate.koordinaten,
    koordinaten_quelle: {
      typ: 'osm',
      beleg: `OpenStreetMap: ${candidate.osm.type} ${candidate.osm.id}`,
      datum: fetchedAt,
      genauigkeit: 'hoch',
    },
    kurztext: { de: `${labelForTyp(candidate.typ)} auf dem Südwestkirchhof Stahnsdorf.` },
    beschreibung: { de: `${candidate.name} ist in OpenStreetMap auf dem Südwestkirchhof Stahnsdorf verzeichnet.` },
    datum_von: null,
    datum_bis: null,
    wikipedia_url: candidate.osm.wikipediaUrl,
    bilder: [],
    audio: {},
    quellen: [],
    status: 'bestätigt',
    notiz: `Aus OSM-Kandidatenexport übernommen. OSM-Tags: ${JSON.stringify(candidate.osm.tags)}\n\nQuellenarchiv:\n- ${sourceLine(candidate)}`,
  };

  Object.keys(poi).forEach((key) => {
    if (!VALID_FIELDS.has(key)) {
      throw new Error(`Invalid POI field: ${key}`);
    }
  });

  return poi;
}

function dedupePOIIds(pois) {
  const seen = new Map();
  return pois.map((poi) => {
    const current = seen.get(poi.id) ?? 0;
    seen.set(poi.id, current + 1);
    if (current === 0) return poi;
    return { ...poi, id: `${poi.id}-${current + 1}` };
  });
}

export function buildAuditResult({ elements, existingPois, fetchedAt, endpoint, query }) {
  const candidates = elements
    .map(extractCandidate)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  const candidatesWithMatches = candidates.map((candidate) => {
    const match = matchCandidate(candidate, existingPois);
    return {
      ...candidate,
      match: match.kind === 'existing'
        ? {
            kind: match.kind,
            reason: match.reason,
            existing_poi_id: match.poi.id,
            existing_name: match.poi.name?.de ?? '',
            distance_meters: match.distance_meters,
          }
        : match,
    };
  });

  const newCandidates = candidatesWithMatches.filter((candidate) => candidate.match.kind === 'new');
  const proposedPois = dedupePOIIds(newCandidates.map((candidate) => createProposedPOI(candidate, fetchedAt)));
  const existingUpdates = candidatesWithMatches
    .filter((candidate) => candidate.match.kind === 'existing')
    .map((candidate) => {
      const existing = existingPois.find((poi) => poi.id === candidate.match.existing_poi_id);
      const distance = distanceMeters(candidate.koordinaten, existing?.koordinaten);
      const hasCoordinateSuggestion = !existing?.koordinaten || (distance !== null && distance > 1);
      return {
        existing_poi_id: candidate.match.existing_poi_id,
        existing_name: candidate.match.existing_name,
        osm_name: candidate.name,
        match_reason: candidate.match.reason,
        distance_meters: distance === null ? null : Number(distance.toFixed(1)),
        suggested_coordinates: hasCoordinateSuggestion ? candidate.koordinaten : null,
        source: sourceLine(candidate),
      };
    });

  return {
    generated_at: new Date().toISOString(),
    fetched_at: fetchedAt,
    source: {
      endpoint,
      bbox: DEFAULT_BBOX,
      query,
      existing_input: DEFAULT_INPUT,
    },
    counts: {
      existing_pois_read: existingPois.length,
      osm_elements_read: elements.length,
      osm_candidates: candidatesWithMatches.length,
      matched_existing: candidatesWithMatches.length - newCandidates.length,
      new_candidates: newCandidates.length,
      proposed_pois: proposedPois.length,
      existing_update_suggestions: existingUpdates.length,
    },
    candidates: candidatesWithMatches,
    proposed_pois: proposedPois,
    existing_update_suggestions: existingUpdates,
  };
}

export function buildOverpassQuery(bbox = DEFAULT_BBOX) {
  const box = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  return `[out:json][timeout:180];
area["name"="Südwestkirchhof Stahnsdorf"]["landuse"="cemetery"]->.cemetery;
(
  nwr(area.cemetery)["historic"~"^(tomb|memorial|monument|chapel)$"];
  nwr(area.cemetery)["tomb"];
  nwr(area.cemetery)["memorial"];
  nwr(area.cemetery)["cemetery"~"^(grave|tomb|section|sector|plot)$"];
  nwr(area.cemetery)["grave"];
  nwr(area.cemetery)["building"~"^(mausoleum|chapel|church)$"];
  nwr(area.cemetery)["amenity"="place_of_worship"];
  nwr(area.cemetery)["wikidata"];
  nwr(area.cemetery)["wikipedia"];
);
out center tags meta;`;
}

function loadExistingPOIs(inputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data.pois)) {
    throw new Error(`No pois array found in ${inputPath}`);
  }
  return data.pois;
}

async function fetchOverpass(query, endpoints = DEFAULT_ENDPOINTS) {
  let lastError;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'user-agent': 'stahnsdorf-cemetery-app-osm-audit/1.0',
        },
        body: new URLSearchParams({ data: query }),
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { endpoint, elements: data.elements ?? [] };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeReport(filePath, audit) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [
    '# OSM-POI-Kandidaten Südwestkirchhof Stahnsdorf',
    '',
    `Erzeugt: ${audit.generated_at}`,
    `OSM abgerufen: ${audit.fetched_at}`,
    `Bestehende POIs gelesen: ${audit.counts.existing_pois_read}`,
    `OSM-Elemente gelesen: ${audit.counts.osm_elements_read}`,
    `OSM-Kandidaten: ${audit.counts.osm_candidates}`,
    `Mit vorhandenen POIs abgeglichen: ${audit.counts.matched_existing}`,
    `Neue POI-Vorschläge: ${audit.counts.proposed_pois}`,
    '',
    '## Neue POI-Vorschläge',
    '',
    '| Name | Typ | Koordinaten | OSM |',
    '|---|---|---:|---|',
    ...audit.proposed_pois.map((poi) => {
      const candidate = audit.candidates.find((item) => item.name === poi.name.de);
      return `| ${escapeTable(poi.name.de)} | ${poi.typ} | ${poi.koordinaten.lat.toFixed(6)}, ${poi.koordinaten.lng.toFixed(6)} | ${candidate?.osm.url ?? ''} |`;
    }),
    '',
    '## Treffer auf bestehende POIs',
    '',
    '| OSM-Name | POI | Grund | Abstand | OSM |',
    '|---|---|---|---:|---|',
    ...audit.candidates
      .filter((candidate) => candidate.match.kind === 'existing')
      .map((candidate) => `| ${escapeTable(candidate.name)} | ${candidate.match.existing_poi_id} | ${candidate.match.reason} | ${candidate.match.distance_meters ?? ''} m | ${candidate.osm.url} |`),
    '',
  ];
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function escapeTable(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    report: DEFAULT_REPORT,
    fetchedAt: new Date().toISOString().slice(0, 10),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--input') args.input = argv[++index];
    else if (arg === '--output') args.output = argv[++index];
    else if (arg === '--report') args.report = argv[++index];
    else if (arg === '--fetched-at') args.fetchedAt = argv[++index];
    else if (arg === '--help') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/osm-candidates.mjs [options]

Options:
  --input <path>       Existing backup JSON with pois[] (default: ${DEFAULT_INPUT})
  --output <path>      JSON audit output (default: ${DEFAULT_OUTPUT})
  --report <path>      Markdown summary output (default: ${DEFAULT_REPORT})
  --fetched-at <date>  Date for source notes, YYYY-MM-DD (default: today)
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);
  const reportPath = path.resolve(args.report);
  const existingPois = loadExistingPOIs(inputPath);
  const query = buildOverpassQuery();
  const { endpoint, elements } = await fetchOverpass(query);
  const audit = buildAuditResult({
    elements,
    existingPois,
    fetchedAt: args.fetchedAt,
    endpoint,
    query,
  });

  writeJson(outputPath, audit);
  writeReport(reportPath, audit);

  console.log(`Read ${audit.counts.existing_pois_read} existing POIs.`);
  console.log(`Read ${audit.counts.osm_elements_read} OSM elements and extracted ${audit.counts.osm_candidates} candidates.`);
  console.log(`Matched ${audit.counts.matched_existing}; proposed ${audit.counts.proposed_pois} new POIs.`);
  console.log(`Wrote ${outputPath}`);
  console.log(`Wrote ${reportPath}`);
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
