import { describe, it, expect } from 'vitest';
import { mergeCoordinates, createNewPoi, generateSlug, buildMergedPois, buildMergedCollections } from '../scripts/merge-pois.mjs';

describe('mergeCoordinates', () => {
  it('adds coordinates from scraping to a POI without coords', () => {
    const poi = { id: 'poi_sws_edmund-rumpler', koordinaten: null, status: 'prüfen', notiz: '' };
    const scraping = { latitude: 52.38845, longitude: 13.18757, location_note: 'Block Reformation' };
    const result = mergeCoordinates(poi, scraping);
    expect(result.koordinaten).toEqual({ lat: 52.38845, lng: 13.18757 });
    expect(result.status).toBe('bestätigt');
  });

  it('overwrites existing coords with scraping coords (higher quality)', () => {
    const poi = { id: 'poi_sws_ernst-gennat', koordinaten: { lat: 52.388, lng: 13.188 }, status: 'bestätigt', notiz: '' };
    const scraping = { latitude: 52.38852, longitude: 13.18782, location_note: 'Block Reformation' };
    const result = mergeCoordinates(poi, scraping);
    expect(result.koordinaten.lat).toBe(52.38852);
    expect(result.koordinaten.lng).toBe(13.18782);
  });

  it('appends lage info to notiz if not already present', () => {
    const poi = { id: 'test', koordinaten: null, status: 'prüfen', notiz: 'Existing note.' };
    const scraping = { latitude: 52.0, longitude: 13.0, location_note: 'Block Trinitatis, Feld 21' };
    const result = mergeCoordinates(poi, scraping);
    expect(result.notiz).toContain('Block Trinitatis, Feld 21');
    expect(result.notiz).toContain('Existing note.');
  });

  it('sets status to bestätigt when coordinates are added', () => {
    const poi = { id: 'test', koordinaten: null, status: 'prüfen', notiz: '' };
    const scraping = { latitude: 52.0, longitude: 13.0, location_note: '' };
    const result = mergeCoordinates(poi, scraping);
    expect(result.status).toBe('bestätigt');
  });

  it('handles null notiz safely', () => {
    const poi = { id: 'test', koordinaten: null, status: 'prüfen', notiz: null };
    const scraping = { latitude: 52.0, longitude: 13.0, location_note: 'Block X' };
    const result = mergeCoordinates(poi, scraping);
    expect(result.notiz).toContain('Block X');
  });
});

describe('generateSlug', () => {
  it('generates slug from first name + last name', () => {
    expect(generateSlug('Felderhoff', 'Reinhold Carl Thusmann')).toBe('reinhold-felderhoff');
  });
  it('transliterates umlauts', () => {
    expect(generateSlug('Schaarwächter', 'Julius Cornelius')).toBe('julius-schaarwaechter');
  });
  it('handles von in names', () => {
    expect(generateSlug('Essen', 'Hans Henrik Freiherr von')).toBe('hans-essen');
  });
});

describe('createNewPoi', () => {
  it('creates a valid POI from scraping data following docs/schema.md', () => {
    const scraping = {
      id: '385',
      name: 'Reinhold Carl Thusmann Felderhoff',
      vorname: 'Reinhold Carl Thusmann',
      nachname: 'Felderhoff',
      beruf: 'Professor, Bildhauer, Graphiker',
      latitude: 52.387747,
      longitude: 13.177103,
      location_note: 'Block Trinitatis, Feld 10, Wahlstelle 64',
      ehrengrab: false,
    };
    const poi = createNewPoi(scraping);
    expect(poi.id).toBe('poi_sws_reinhold-felderhoff');
    expect(poi.typ).toBe('grab');
    expect(poi.koordinaten).toEqual({ lat: 52.387747, lng: 13.177103 });
    expect(poi.status).toBe('bestätigt');
    expect(poi.name.de).toBe('Reinhold Carl Thusmann Felderhoff');
    expect(poi.kurztext.de).toContain('Felderhoff');
    expect(poi.beschreibung.de).toContain('Felderhoff');
    expect(poi.bilder).toEqual([]);
    expect(poi.audio).toEqual({});
    expect(poi.quellen).toContain('wo-sie-ruhen.de, Südwestkirchhof Stahnsdorf, API-Extraktion 2026-04-04');
    // Schema compliance: only valid fields
    const VALID_FIELDS = new Set(['id', 'typ', 'name', 'koordinaten', 'kurztext', 'beschreibung',
      'datum_von', 'datum_bis', 'wikipedia_url', 'bilder', 'audio', 'quellen', 'status', 'notiz']);
    Object.keys(poi).forEach(key => expect(VALID_FIELDS.has(key)).toBe(true));
  });
});

describe('buildMergedPois', () => {
  it('returns 75 POIs (71 existing + 4 new)', () => {
    const result = buildMergedPois();
    expect(result).toHaveLength(75);
  });

  it('all POIs with koordinaten have status bestätigt', () => {
    const result = buildMergedPois();
    const withCoords = result.filter(p => p.koordinaten !== null);
    withCoords.forEach(p => {
      expect(p.status).toBe('bestätigt');
    });
  });

  it('all IDs follow poi_sws_ convention', () => {
    const result = buildMergedPois();
    result.forEach(p => {
      expect(p.id).toMatch(/^poi_sws_/);
    });
  });

  it('existing POIs with GPS not in scraping retain their coordinates', () => {
    const result = buildMergedPois();
    const kapelle = result.find(p => p.id === 'poi_sws_hauptkapelle');
    expect(kapelle.koordinaten).not.toBeNull();
    const eingang = result.find(p => p.id === 'poi_sws_friedhofseingang');
    expect(eingang.koordinaten).not.toBeNull();
  });

  it('no duplicate IDs', () => {
    const result = buildMergedPois();
    const ids = result.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('scraping coords replace lower-precision existing coords', () => {
    const result = buildMergedPois();
    // lovis-corinth had coords 52.391, 13.176 (3 decimals) -> scraping has 52.38764, 13.17958
    const corinth = result.find(p => p.id === 'poi_sws_lovis-corinth');
    expect(corinth.koordinaten.lat).toBe(52.38764);
    expect(corinth.koordinaten.lng).toBe(13.17958);
  });

  it('output POIs only have schema-conformant fields', () => {
    const VALID_FIELDS = new Set([
      'id', 'typ', 'name', 'koordinaten', 'kurztext', 'beschreibung',
      'datum_von', 'datum_bis', 'wikipedia_url', 'bilder', 'audio',
      'quellen', 'status', 'notiz',
    ]);
    const result = buildMergedPois();
    result.forEach(p => {
      Object.keys(p).forEach(key => {
        expect(VALID_FIELDS.has(key)).toBe(true);
      });
    });
  });
});

describe('buildMergedCollections', () => {
  it('renames all non-standard IDs in pois arrays', () => {
    const result = buildMergedCollections();
    const allPoiRefs = result.flatMap(c => c.pois);
    const nonStandard = allPoiRefs.filter(id => !id.startsWith('poi_sws_'));
    expect(nonStandard).toEqual([]);
  });

  it('preserves collection count', () => {
    const result = buildMergedCollections();
    expect(result).toHaveLength(9);
  });
});
