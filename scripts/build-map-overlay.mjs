import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const OVERLAY_WAY_ID = 25029213;

const DEFAULT_OUTPUT = 'public/map-overlay.geojson';
const DEFAULT_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const ALLOWED_HIGHWAYS = new Set([
  'footway',
  'path',
  'service',
  'track',
  'pedestrian',
  'steps',
]);

export function buildOverpassQuery() {
  return `[out:json][timeout:120];
way(${OVERLAY_WAY_ID})->.cemetery;
.cemetery map_to_area->.cemeteryArea;
(
  .cemetery;
  way(area.cemeteryArea)["highway"~"^(footway|path|service|track|pedestrian|steps)$"];
);
out tags geom;`;
}

export function convertOverpassToGeoJSON(payload, options = {}) {
  const elements = Array.isArray(payload?.elements) ? payload.elements : [];
  const boundary = elements.find((element) => (
    element.type === 'way'
    && element.id === OVERLAY_WAY_ID
    && Array.isArray(element.geometry)
    && element.geometry.length >= 4
  ));

  if (!boundary) {
    throw new Error(`OpenStreetMap way ${OVERLAY_WAY_ID} fehlt in der Overpass-Antwort.`);
  }

  const boundaryCoordinates = closeRing(toCoordinates(boundary.geometry));
  const features = [{
    type: 'Feature',
    properties: { kind: 'cemetery' },
    geometry: {
      type: 'Polygon',
      coordinates: [boundaryCoordinates],
    },
  }];

  const pathElements = elements
    .filter((element) => ALLOWED_HIGHWAYS.has(element?.tags?.highway))
    .sort((left, right) => left.id - right.id);

  for (const element of pathElements) {
    const highway = element?.tags?.highway;
    if (
      element.type !== 'way'
      || !Array.isArray(element.geometry)
      || element.geometry.length < 2
    ) {
      continue;
    }

    const clippedLines = clipLineStringToPolygon(toCoordinates(element.geometry), boundaryCoordinates);
    if (clippedLines.length === 0) continue;

    const properties = { kind: 'path', highway };
    if (element.tags.service) properties.service = element.tags.service;
    features.push({
      type: 'Feature',
      properties,
      geometry: clippedLines.length === 1
        ? { type: 'LineString', coordinates: clippedLines[0] }
        : { type: 'MultiLineString', coordinates: clippedLines },
    });
  }

  return {
    type: 'FeatureCollection',
    metadata: {
      source: 'OpenStreetMap',
      sourceUrl: `https://www.openstreetmap.org/way/${OVERLAY_WAY_ID}`,
      license: 'ODbL-1.0',
      osmDataTimestamp: payload?.osm3s?.timestamp_osm_base ?? null,
      generatedAt: options.generatedAt ?? new Date().toISOString(),
    },
    features,
  };
}

function toCoordinates(geometry) {
  return geometry.map(({ lat, lon }) => [roundCoordinate(lon), roundCoordinate(lat)]);
}

function closeRing(coordinates) {
  const first = coordinates[0];
  const last = coordinates.at(-1);
  if (first[0] === last[0] && first[1] === last[1]) return coordinates;
  return [...coordinates, first];
}

function clipLineStringToPolygon(line, ring) {
  const parts = [];
  let current = [];

  const flush = () => {
    if (current.length >= 2) parts.push(current);
    current = [];
  };

  for (let index = 0; index < line.length - 1; index += 1) {
    const start = line[index];
    const end = line[index + 1];
    const intervals = segmentIntervalsInsidePolygon(start, end, ring);
    if (intervals.length === 0) {
      flush();
      continue;
    }

    for (const [from, to] of intervals) {
      const clippedStart = interpolate(start, end, from);
      const clippedEnd = interpolate(start, end, to);
      const previous = current.at(-1);
      if (!previous || !sameCoordinate(previous, clippedStart)) {
        flush();
        current.push(clippedStart);
      }
      if (!sameCoordinate(current.at(-1), clippedEnd)) current.push(clippedEnd);
    }
  }

  flush();
  return parts;
}

function segmentIntervalsInsidePolygon(start, end, ring) {
  const intersections = [0, 1];
  for (let index = 0; index < ring.length - 1; index += 1) {
    const parameter = segmentIntersectionParameter(start, end, ring[index], ring[index + 1]);
    if (parameter !== null) intersections.push(parameter);
  }

  const sorted = [...new Set(intersections.map((value) => Number(value.toFixed(12))))]
    .sort((left, right) => left - right);
  const intervals = [];
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const from = sorted[index];
    const to = sorted[index + 1];
    if (to - from < 1e-12) continue;
    const midpoint = interpolate(start, end, (from + to) / 2);
    if (pointInPolygon(midpoint, ring)) intervals.push([from, to]);
  }
  return intervals;
}

function segmentIntersectionParameter(start, end, edgeStart, edgeEnd) {
  const direction = [end[0] - start[0], end[1] - start[1]];
  const edgeDirection = [edgeEnd[0] - edgeStart[0], edgeEnd[1] - edgeStart[1]];
  const denominator = cross(direction, edgeDirection);
  if (Math.abs(denominator) < 1e-14) return null;

  const offset = [edgeStart[0] - start[0], edgeStart[1] - start[1]];
  const lineParameter = cross(offset, edgeDirection) / denominator;
  const edgeParameter = cross(offset, direction) / denominator;
  if (lineParameter < 0 || lineParameter > 1 || edgeParameter < 0 || edgeParameter > 1) return null;
  return lineParameter;
}

function pointInPolygon(point, ring) {
  let inside = false;
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [xCurrent, yCurrent] = ring[current];
    const [xPrevious, yPrevious] = ring[previous];
    const crosses = (yCurrent > point[1]) !== (yPrevious > point[1])
      && point[0] < ((xPrevious - xCurrent) * (point[1] - yCurrent)) / (yPrevious - yCurrent) + xCurrent;
    if (crosses) inside = !inside;
  }
  return inside;
}

function interpolate(start, end, parameter) {
  return [
    roundCoordinate(start[0] + (end[0] - start[0]) * parameter),
    roundCoordinate(start[1] + (end[1] - start[1]) * parameter),
  ];
}

function cross(left, right) {
  return left[0] * right[1] - left[1] * right[0];
}

function sameCoordinate(left, right) {
  return left[0] === right[0] && left[1] === right[1];
}

function roundCoordinate(value) {
  if (!Number.isFinite(value)) throw new Error('Ungültige Koordinate in der Overpass-Antwort.');
  return Number(value.toFixed(6));
}

async function fetchOverpass(query, endpoints) {
  const errors = [];
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'user-agent': 'stahnsdorf-cemetery-app-map-overlay/1.0',
        },
        body: new URLSearchParams({ data: query }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      errors.push(`${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`Overpass-Abfrage fehlgeschlagen:\n${errors.join('\n')}`);
}

function parseArgs(argv) {
  const args = { output: DEFAULT_OUTPUT, input: null, endpoint: null, generatedAt: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--output') args.output = argv[++index];
    else if (argument === '--input') args.input = argv[++index];
    else if (argument === '--endpoint') args.endpoint = argv[++index];
    else if (argument === '--generated-at') args.generatedAt = argv[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const payload = args.input
    ? JSON.parse(fs.readFileSync(path.resolve(args.input), 'utf8'))
    : await fetchOverpass(buildOverpassQuery(), args.endpoint ? [args.endpoint] : DEFAULT_ENDPOINTS);
  const geojson = convertOverpassToGeoJSON(payload, {
    generatedAt: args.generatedAt ?? new Date().toISOString(),
  });
  const outputPath = path.resolve(args.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(geojson)}\n`, 'utf8');
  console.log(`Karten-Overlay geschrieben: ${outputPath} (${geojson.features.length} Features)`);
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
