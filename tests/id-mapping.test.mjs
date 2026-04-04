// tests/id-mapping.test.mjs
import { describe, it, expect } from 'vitest';
import { SCRAPING_TO_EXISTING, ID_RENAMES, applyRenames, applyRenamesInCollections } from '../scripts/id-mapping.mjs';

describe('SCRAPING_TO_EXISTING', () => {
  it('maps all 23 matching scraping IDs to existing POI IDs', () => {
    expect(Object.keys(SCRAPING_TO_EXISTING)).toHaveLength(23);
    expect(SCRAPING_TO_EXISTING['367']).toBe('ernst-gennat'); // pre-rename ID
    expect(SCRAPING_TO_EXISTING['376']).toBe('engelbert-humperdinck'); // pre-rename ID
    expect(SCRAPING_TO_EXISTING['378']).toBe('fw-murnau'); // pre-rename ID
    expect(SCRAPING_TO_EXISTING['383']).toBe('poi_sws_adolf-bastian');
  });

  it('does not include the 4 new POIs', () => {
    expect(SCRAPING_TO_EXISTING['385']).toBeUndefined(); // Felderhoff
    expect(SCRAPING_TO_EXISTING['390']).toBeUndefined(); // Schaarwächter
    expect(SCRAPING_TO_EXISTING['394']).toBeUndefined(); // von Essen
    expect(SCRAPING_TO_EXISTING['396']).toBeUndefined(); // Seger
  });
});

describe('ID_RENAMES', () => {
  it('maps 11 non-standard IDs to poi_sws_ convention', () => {
    expect(Object.keys(ID_RENAMES)).toHaveLength(11);
    expect(ID_RENAMES['ernst-gennat']).toBe('poi_sws_ernst-gennat');
    expect(ID_RENAMES['fw-murnau']).toBe('poi_sws_fw-murnau');
    expect(ID_RENAMES['hauptkapelle']).toBe('poi_sws_hauptkapelle');
  });
});

describe('applyRenames', () => {
  it('renames IDs in a POI array', () => {
    const pois = [
      { id: 'ernst-gennat', name: { de: 'Test' } },
      { id: 'poi_sws_emil-krebs', name: { de: 'Test2' } },
    ];
    const result = applyRenames(pois);
    expect(result[0].id).toBe('poi_sws_ernst-gennat');
    expect(result[1].id).toBe('poi_sws_emil-krebs'); // unchanged
  });
});

describe('applyRenamesInCollections', () => {
  it('renames all non-standard IDs in pois arrays', () => {
    const collections = [
      { id: 'col1', pois: ['ernst-gennat', 'poi_sws_emil-krebs', 'fw-murnau'] },
    ];
    const result = applyRenamesInCollections(collections);
    expect(result[0].pois).toEqual([
      'poi_sws_ernst-gennat',
      'poi_sws_emil-krebs',
      'poi_sws_fw-murnau',
    ]);
  });
});
