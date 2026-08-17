import { describe, it, expect } from 'vitest';
import {
  classifyOSMElement,
  createProposedPOI,
  extractCandidate,
  buildOverpassQuery,
  matchCandidate,
  normalizeName,
} from '../scripts/osm-candidates.mjs';

describe('normalizeName', () => {
  it('normalizes case, punctuation, accents, and German umlauts for matching', () => {
    expect(normalizeName('  Grabstätte F. W. Murnau / Friedrich Wilhelm  ')).toBe('grabstaette f w murnau friedrich wilhelm');
  });
});

describe('classifyOSMElement', () => {
  it('classifies OSM tomb tags as grab', () => {
    expect(classifyOSMElement({ tags: { historic: 'tomb', tomb: 'family' } })).toBe('grab');
  });

  it('classifies mausoleum tags as mausoleum', () => {
    expect(classifyOSMElement({ tags: { historic: 'tomb', tomb: 'mausoleum' } })).toBe('mausoleum');
  });

  it('classifies memorial tags as gedenkanlage when they describe a broad memorial site', () => {
    expect(classifyOSMElement({ tags: { historic: 'memorial', memorial: 'war_memorial' } })).toBe('gedenkanlage');
  });
});

describe('buildOverpassQuery', () => {
  it('queries within the named cemetery area before falling back to tags', () => {
    const query = buildOverpassQuery();
    expect(query).toContain('area["name"="Südwestkirchhof Stahnsdorf"]');
    expect(query).toContain('area.cemetery');
  });
});

describe('extractCandidate', () => {
  it('extracts coordinates from nodes and keeps OSM source metadata', () => {
    const candidate = extractCandidate({
      type: 'node',
      id: 123,
      lat: 52.388,
      lon: 13.188,
      timestamp: '2026-05-20T12:00:00Z',
      version: 7,
      tags: {
        name: 'Heinrich Zille',
        historic: 'tomb',
        wikidata: 'Q123',
        wikipedia: 'de:Heinrich Zille',
      },
    });

    expect(candidate.name).toBe('Heinrich Zille');
    expect(candidate.typ).toBe('grab');
    expect(candidate.koordinaten).toEqual({ lat: 52.388, lng: 13.188 });
    expect(candidate.osm.url).toBe('https://www.openstreetmap.org/node/123');
    expect(candidate.osm.wikidata).toBe('Q123');
  });

  it('uses center coordinates for ways and relations', () => {
    const candidate = extractCandidate({
      type: 'way',
      id: 456,
      center: { lat: 52.389, lon: 13.189 },
      tags: { name: 'Mausoleum Test', historic: 'tomb', tomb: 'mausoleum' },
    });

    expect(candidate.koordinaten).toEqual({ lat: 52.389, lng: 13.189 });
  });
});

describe('matchCandidate', () => {
  const existing = [
    {
      id: 'poi_sws_heinrich-zille',
      name: { de: 'Heinrich Zille' },
      koordinaten: { lat: 52.388, lng: 13.188 },
      wikipedia_url: 'https://de.wikipedia.org/wiki/Heinrich_Zille',
    },
    {
      id: 'poi_sws_lovis-corinth',
      name: { de: 'Lovis Corinth' },
      koordinaten: { lat: 52.39, lng: 13.19 },
    },
    {
      id: 'poi_sws_hauptkapelle',
      name: { de: 'Friedhofskapelle' },
      koordinaten: { lat: 52.3895, lng: 13.181 },
      koordinaten_quelle: {
        typ: 'osm',
        beleg: 'OpenStreetMap: way 228818020',
      },
      quellen: [],
    },
    {
      id: 'poi_sws_heldenblock',
      name: { de: 'Kriegsgräberstätte Heldenblock' },
      koordinaten: { lat: 52.3896, lng: 13.1845 },
    },
    {
      id: 'poi_sws_gustav-langenscheidt',
      name: { de: 'Gustav Langenscheidt' },
      koordinaten: { lat: 52.3912, lng: 13.1737 },
    },
  ];

  it('matches existing POIs by normalized name', () => {
    const result = matchCandidate({ name: 'heinrich zille', koordinaten: { lat: 52.5, lng: 13.5 }, osm: {} }, existing);
    expect(result.kind).toBe('existing');
    expect(result.reason).toBe('name');
    expect(result.poi.id).toBe('poi_sws_heinrich-zille');
  });

  it('matches existing POIs when OSM adds grave prefixes or life dates', () => {
    const result = matchCandidate({
      name: 'Grabmal Heinrich Zille (1858-1929)',
      koordinaten: { lat: 52.38801, lng: 13.18801 },
      osm: {},
    }, existing);
    expect(result.kind).toBe('existing');
    expect(result.reason).toBe('name');
    expect(result.poi.id).toBe('poi_sws_heinrich-zille');
  });

  it('matches existing POIs by Wikipedia URL', () => {
    const result = matchCandidate({
      name: 'Andere Beschriftung',
      koordinaten: { lat: 52.5, lng: 13.5 },
      osm: { wikipediaUrl: 'https://de.wikipedia.org/wiki/Heinrich_Zille' },
    }, existing);
    expect(result.kind).toBe('existing');
    expect(result.reason).toBe('wikipedia');
    expect(result.poi.id).toBe('poi_sws_heinrich-zille');
  });

  it('matches existing POIs by their structured OSM coordinate source', () => {
    const result = matchCandidate({
      name: 'Norwegische Holzkirche',
      koordinaten: { lat: 52.3895, lng: 13.181 },
      osm: { type: 'way', id: 228818020, url: 'https://www.openstreetmap.org/way/228818020' },
    }, existing);
    expect(result.kind).toBe('existing');
    expect(result.reason).toBe('osm_source');
    expect(result.poi.id).toBe('poi_sws_hauptkapelle');
  });

  it('matches existing POIs by ID slug when the candidate has a shorter section name', () => {
    const result = matchCandidate({
      name: 'Heldenblock',
      koordinaten: { lat: 52.38961, lng: 13.18451 },
      osm: {},
    }, existing);
    expect(result.kind).toBe('existing');
    expect(result.reason).toBe('id');
    expect(result.poi.id).toBe('poi_sws_heldenblock');
  });

  it('matches one-character OSM spelling variants in otherwise matching names', () => {
    const result = matchCandidate({
      name: 'Grabmal Familie Gustav Langenscheid',
      koordinaten: { lat: 52.3912, lng: 13.1737 },
      osm: {},
    }, existing);
    expect(result.kind).toBe('existing');
    expect(result.reason).toBe('name');
    expect(result.poi.id).toBe('poi_sws_gustav-langenscheidt');
  });

  it('keeps unmatched candidates as new POIs', () => {
    const result = matchCandidate({ name: 'Neu aus OSM', koordinaten: { lat: 52.1, lng: 13.1 }, osm: {} }, existing);
    expect(result.kind).toBe('new');
  });
});

describe('createProposedPOI', () => {
  it('creates a schema-conformant trusted POI proposal from an OSM candidate', () => {
    const poi = createProposedPOI({
      name: 'Grabstätte Beispiel',
      typ: 'grab',
      koordinaten: { lat: 52.388, lng: 13.188 },
      osm: {
        type: 'way',
        id: 789,
        url: 'https://www.openstreetmap.org/way/789',
        timestamp: '2026-05-20T12:00:00Z',
        version: 3,
        tags: { historic: 'tomb' },
      },
    }, '2026-05-25');

    expect(poi.id).toBe('poi_sws_grabstaette-beispiel');
    expect(poi.koordinaten_quelle).toEqual({
      typ: 'osm',
      beleg: 'OpenStreetMap: way 789',
      datum: '2026-05-25',
      genauigkeit: 'hoch',
    });
    expect(poi.status).toBe('bestätigt');
    expect(poi.quellen).toEqual([]);
    expect(poi.notiz).toContain('OpenStreetMap: way 789');
    expect(poi.notiz).toContain('https://www.openstreetmap.org/way/789');
    expect(poi.notiz).toContain('OSM-Tags');

    const validFields = new Set(['id', 'typ', 'name', 'koordinaten', 'koordinaten_quelle', 'lagehinweis', 'lagehinweis_quelle', 'kurztext', 'beschreibung', 'datum_von', 'datum_bis', 'wikipedia_url', 'bilder', 'audio', 'quellen', 'status', 'notiz']);
    Object.keys(poi).forEach((key) => expect(validFields.has(key)).toBe(true));
  });
});
