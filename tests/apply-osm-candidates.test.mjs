import { describe, expect, it } from 'vitest';
import {
  applyOSMAuditToBackup,
  NEW_POI_DETAILS,
} from '../scripts/apply-osm-candidates.mjs';

describe('applyOSMAuditToBackup', () => {
  it('updates existing matched POIs with OSM coordinates and source notes', () => {
    const backup = {
      pois: [
        {
          id: 'poi_sws_existing',
          typ: 'grab',
          name: { de: 'Existing' },
          koordinaten: { lat: 52, lng: 13 },
          quellen: [],
          notiz: '',
          status: 'prüfen',
        },
      ],
      collections: [],
    };
    const audit = {
      candidates: [
        {
          name: 'Existing',
          typ: 'grab',
          koordinaten: { lat: 52.1, lng: 13.1 },
          match: { kind: 'existing', existing_poi_id: 'poi_sws_existing' },
          osm: {
            type: 'node',
            id: 1,
            url: 'https://www.openstreetmap.org/node/1',
            version: 2,
            timestamp: '2026-05-20T12:00:00Z',
            tags: { cemetery: 'grave' },
          },
        },
      ],
    };

    const result = applyOSMAuditToBackup(backup, audit, { fetchedAt: '2026-05-25' });
    expect(result.pois[0].koordinaten).toEqual({ lat: 52.1, lng: 13.1 });
    expect(result.pois[0].koordinaten_quelle).toEqual({
      typ: 'osm',
      beleg: 'OpenStreetMap: node 1',
      datum: '2026-05-25',
      genauigkeit: 'hoch',
    });
    expect(result.pois[0].status).toBe('bestätigt');
    expect(result.pois[0].quellen).toEqual([]);
    expect(result.pois[0].notiz).toContain('OSM-Koordinate übernommen');
    expect(result.pois[0].notiz).toContain('https://www.openstreetmap.org/node/1');
  });

  it('adds trusted new POIs with localized text and Firestore backup fields', () => {
    const backup = { pois: [], collections: [] };
    const audit = {
      candidates: [
        {
          name: 'Grab Paul Manteufel',
          typ: 'grab',
          koordinaten: { lat: 52.3863979, lng: 13.1811283 },
          match: { kind: 'new' },
          osm: {
            type: 'node',
            id: 12312719341,
            url: 'https://www.openstreetmap.org/node/12312719341',
            version: 1,
            timestamp: '2026-05-20T12:00:00Z',
            wikipedia: null,
            wikipediaUrl: null,
            tags: {
              'buried:wikipedia': 'de:Paul Manteufel',
              inscription: 'Prof. Dr. med. Paul Manteufel\n* 11.7.1879  14.1.1941',
              name: 'Grab Paul Manteufel',
            },
          },
        },
      ],
    };

    const result = applyOSMAuditToBackup(backup, audit, { fetchedAt: '2026-05-25', timestamp: '2026-05-25T00:00:00.000Z' });
    expect(result.pois).toHaveLength(1);
    expect(result.pois[0].id).toBe('poi_sws_paul-manteufel');
    expect(result.pois[0].name.en).toBe('Paul Manteufel');
    expect(result.pois[0].kurztext.ru).toContain('Могила');
    expect(result.pois[0].publish_status).toBe('veröffentlicht');
    expect(result.pois[0].koordinaten_quelle.typ).toBe('osm');
    expect(result.pois[0].quellen).toEqual([]);
    expect(result.pois[0].notiz).toContain('https://www.openstreetmap.org/node/12312719341');
    expect(result.pois[0].wikipedia_url).toBe('https://de.wikipedia.org/wiki/Paul_Manteufel');
  });

  it('updates already-added OSM POIs instead of adding duplicates on rerun', () => {
    const audit = {
      candidates: [
        {
          name: 'Michael Heinrich',
          typ: 'grab',
          koordinaten: { lat: 52.3909401, lng: 13.1859802 },
          match: { kind: 'new' },
          osm: {
            type: 'node',
            id: 12912566004,
            url: 'https://www.openstreetmap.org/node/12912566004',
            version: 1,
            timestamp: '2025-06-13T12:30:59Z',
            tags: { name: 'Michael Heinrich' },
          },
        },
      ],
    };
    const once = applyOSMAuditToBackup({ pois: [], collections: [] }, audit, { fetchedAt: '2026-05-25' });
    const twice = applyOSMAuditToBackup(once, audit, { fetchedAt: '2026-05-25' });

    expect(twice.pois.filter((poi) => poi.id === 'poi_sws_michael-heinrich')).toHaveLength(1);
    expect(twice.pois[0].notiz.match(/https:\/\/www\.openstreetmap\.org\/node\/12912566004/g)).toHaveLength(1);
  });

  it('chooses the richer OSM object when several candidates match the same existing POI', () => {
    const backup = {
      pois: [
        {
          id: 'poi_sws_heinrich-zille',
          typ: 'grab',
          name: { de: 'Heinrich Zille' },
          koordinaten: null,
          quellen: [],
          notiz: '',
          status: 'prüfen',
        },
      ],
      collections: [],
    };
    const audit = {
      candidates: [
        {
          name: 'Grab Heinrich Zille',
          typ: 'grab',
          koordinaten: { lat: 52.390056, lng: 13.1774106 },
          match: { kind: 'existing', existing_poi_id: 'poi_sws_heinrich-zille' },
          osm: { type: 'node', id: 3811316421, url: 'https://www.openstreetmap.org/node/3811316421', tags: { historic: 'tomb', name: 'Grab Heinrich Zille' } },
        },
        {
          name: 'Grabmal Heinrich Zille',
          typ: 'grab',
          koordinaten: { lat: 52.3900635, lng: 13.1773688 },
          match: { kind: 'existing', existing_poi_id: 'poi_sws_heinrich-zille' },
          osm: {
            type: 'node',
            id: 2547420763,
            url: 'https://www.openstreetmap.org/node/2547420763',
            tags: { 'buried:wikipedia': 'de:Heinrich Zille', 'buried:wikidata': 'Q498211', cemetery: 'grave', historic: 'tomb', name: 'Grabmal Heinrich Zille' },
          },
        },
      ],
    };

    const result = applyOSMAuditToBackup(backup, audit, { fetchedAt: '2026-05-25' });
    expect(result.pois[0].koordinaten).toEqual({ lat: 52.3900635, lng: 13.1773688 });
    expect(result.pois[0].quellen).toEqual([]);
    expect(result.pois[0].notiz).toContain('node 2547420763');
  });

  it('uses editorial names for unnamed OSM objects', () => {
    expect(NEW_POI_DETAILS['Denkmal (node 13629435895)'].id).toBe('poi_sws_namenlose-metallstatue');
    expect(NEW_POI_DETAILS['Gedenkanlage (node 11966089685)'].name.de).toBe('Namenlose Kriegsgräber-Gedenkanlage I');
  });
});
