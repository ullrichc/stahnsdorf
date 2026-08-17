import { describe, expect, test } from 'vitest';
import {
  cleanupEditorialData,
  cleanupPoiSources,
  COLLECTION_DESCRIPTIONS,
} from '../scripts/cleanup-editorial-data.mjs';

const WIKIPEDIA_URL = 'https://de.wikipedia.org/wiki/S%C3%BCdwestkirchhof_Stahnsdorf';

describe('cleanupPoiSources', () => {
  test('cleans public sources and preserves removed metadata in the internal note', () => {
    const poi = {
      id: 'poi_sws_test',
      notiz: 'Block Test.',
      koordinaten_quelle: {
        typ: 'osm',
        beleg: 'OpenStreetMap: node 1',
        datum: '2026-05-25',
        genauigkeit: 'hoch',
      },
      quellen: [
        'Personen und Bauwerke / Grabstättenplan, Südwestkirchhof Stahnsdorf, https://example.org/plan.pdf, abgerufen 2026-03-25',
        `Wikipedia: Südwestkirchhof Stahnsdorf, ${WIKIPEDIA_URL}, abgerufen 2026-06-06`,
        'Anita Kupsch, Wikipedia, https://de.wikipedia.org/wiki/Anita_Kupsch, abgerufen 2026-03-25',
        'OpenStreetMap: node 1, https://www.openstreetmap.org/node/1, Version 2, Stand 2025-10-12T19:14:46Z, abgerufen 2026-05-25',
        'Manuelle GPS-Erfassung via OsmAnd: inputdata/koordinaten.txt, Test, https://osmand.net/map?pin=1,2',
      ],
    };

    const result = cleanupPoiSources(poi);

    expect(result.quellen).toEqual([
      `[Südwestkirchhof Stahnsdorf, Wikipedia](${WIKIPEDIA_URL})`,
      '[Anita Kupsch, Wikipedia](https://de.wikipedia.org/wiki/Anita_Kupsch)',
    ]);
    expect(result.koordinaten_quelle).toEqual(poi.koordinaten_quelle);
    expect(result.notiz).toContain('Quellenarchiv:');
    expect(result.notiz).toContain('Grabstättenplan');
    expect(result.notiz).toContain('Manuelle GPS-Erfassung via OsmAnd');
    expect(result.notiz).toContain('OpenStreetMap: node 1');
    expect(result.notiz).toContain('Abrufdatum: 25.03.2026');
    expect(result.notiz).not.toContain('abgerufen');
  });

  test('normalizes all legacy Wikipedia source variants to named Markdown links', () => {
    const poi = {
      id: 'poi_sws_test',
      notiz: '',
      quellen: [
        'Inge Deutschkron, Wikipedia, https://de.wikipedia.org/wiki/Inge_Deutschkron',
        'Wikipedia: Ernst Seger, https://de.wikipedia.org/wiki/Ernst_Seger',
        '[Bereits benannt, Wikipedia](https://de.wikipedia.org/wiki/Bereits_benannt)',
      ],
    };

    expect(cleanupPoiSources(poi).quellen).toEqual([
      '[Inge Deutschkron, Wikipedia](https://de.wikipedia.org/wiki/Inge_Deutschkron)',
      '[Ernst Seger, Wikipedia](https://de.wikipedia.org/wiki/Ernst_Seger)',
      '[Bereits benannt, Wikipedia](https://de.wikipedia.org/wiki/Bereits_benannt)',
    ]);
  });

  test('does not duplicate an OSM source that is already stored in the source archive', () => {
    const osmSource = 'OpenStreetMap: node 1, https://www.openstreetmap.org/node/1, Version 2, Stand 12.10.2025, 19:14:46 UTC';
    const poi = {
      id: 'poi_sws_test',
      notiz: `Quellenarchiv:\n- ${osmSource}; Abrufdatum: 25.05.2026`,
      quellen: [osmSource],
    };

    const result = cleanupPoiSources(poi);

    expect(result.quellen).toEqual([]);
    expect(result.notiz.match(/OpenStreetMap: node 1/g)).toHaveLength(1);
  });

  test('is idempotent', () => {
    const backup = {
      pois: [{
        id: 'poi_sws_test',
        notiz: '',
        quellen: [`Südwestkirchhof Stahnsdorf, Wikipedia, ${WIKIPEDIA_URL}, abgerufen 2026-03-25`],
      }],
      collections: [],
    };

    const once = cleanupEditorialData(backup);
    const twice = cleanupEditorialData(once);
    expect(twice).toEqual(once);
  });
});

describe('collection descriptions', () => {
  test('provides all six target languages for all twelve collections', () => {
    expect(Object.keys(COLLECTION_DESCRIPTIONS)).toHaveLength(12);
    for (const description of Object.values(COLLECTION_DESCRIPTIONS)) {
      expect(Object.keys(description).sort()).toEqual(['de', 'en', 'fr', 'pl', 'ru', 'sv']);
      expect(description.de).not.toMatch(/Diese Sammlung|Die Sammlung/);
    }
  });
});
