import { describe, expect, test } from 'vitest';
import {
  OVERLAY_WAY_ID,
  buildOverpassQuery,
  convertOverpassToGeoJSON,
} from '../scripts/build-map-overlay.mjs';

const payload = {
  osm3s: { timestamp_osm_base: '2026-08-17T10:00:00Z' },
  elements: [
    {
      type: 'way',
      id: 25029213,
      tags: { landuse: 'cemetery', name: 'Südwestkirchhof Stahnsdorf' },
      geometry: [
        { lat: 52.38000049, lon: 13.17000049 },
        { lat: 52.39000049, lon: 13.17000049 },
        { lat: 52.39000049, lon: 13.18000049 },
        { lat: 52.38000049, lon: 13.18000049 },
        { lat: 52.38000049, lon: 13.17000049 },
      ],
    },
    {
      type: 'way',
      id: 10,
      tags: { highway: 'service', service: 'driveway', name: 'Interner Name' },
      geometry: [
        { lat: 52.38123456, lon: 13.169 },
        { lat: 52.38123456, lon: 13.17234567 },
      ],
    },
    {
      type: 'way',
      id: 11,
      tags: { highway: 'residential' },
      geometry: [
        { lat: 52.381, lon: 13.171 },
        { lat: 52.382, lon: 13.172 },
      ],
    },
  ],
};

describe('build-map-overlay', () => {
  test('targets the known cemetery and all supported path classes', () => {
    const query = buildOverpassQuery();

    expect(OVERLAY_WAY_ID).toBe(25029213);
    expect(query).toContain('way(25029213)');
    expect(query).toContain('footway|path|service|track|pedestrian|steps');
    expect(query).toContain('out tags geom');
  });

  test('creates compact GeoJSON with a boundary and supported paths only', () => {
    const result = convertOverpassToGeoJSON(payload, {
      generatedAt: '2026-08-17T12:00:00.000Z',
    });

    expect(result.type).toBe('FeatureCollection');
    expect(result.metadata).toEqual({
      source: 'OpenStreetMap',
      sourceUrl: 'https://www.openstreetmap.org/way/25029213',
      license: 'ODbL-1.0',
      osmDataTimestamp: '2026-08-17T10:00:00Z',
      generatedAt: '2026-08-17T12:00:00.000Z',
    });
    expect(result.features).toHaveLength(2);
    expect(result.features[0]).toMatchObject({
      geometry: { type: 'Polygon' },
      properties: { kind: 'cemetery' },
    });
    expect(result.features[1]).toMatchObject({
      geometry: { type: 'LineString' },
      properties: { kind: 'path', highway: 'service', service: 'driveway' },
    });
    expect(result.features[1].properties).not.toHaveProperty('name');
    expect(result.features[1].geometry.coordinates[0]).toEqual([13.17, 52.381235]);
  });

  test('sorts paths deterministically for the same data and generation timestamp', () => {
    const options = { generatedAt: '2026-08-17T12:00:00.000Z' };
    const reordered = {
      ...payload,
      elements: [payload.elements[2], payload.elements[1], payload.elements[0]],
    };

    expect(convertOverpassToGeoJSON(reordered, options)).toEqual(
      convertOverpassToGeoJSON(payload, options),
    );
  });

  test('rejects responses without the configured cemetery boundary', () => {
    expect(() => convertOverpassToGeoJSON({ elements: [] }, {
      generatedAt: '2026-08-17T12:00:00.000Z',
    })).toThrow(/25029213/);
  });
});
