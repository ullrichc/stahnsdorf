import { describe, expect, it } from 'vitest';
import {
  applyManualOSMAndCoordinates,
  parseManualOSMAndCoordinates,
} from '../scripts/manual-osmand-coordinates.mjs';

const INPUT = `Rudolf Breitscheid
Standort: geo:52.38806,13.17515?z=15&q=52.38806,13.17515(Rudolf+Breitscheid)
https://osmand.net/map?pin=52.38806,13.17515#15/52.38806/13.17515
Hanno Günther
Standort: geo:52.38424,13.18373?z=15&q=52.38424,13.18373(Hanno+G%C3%BCnther)
https://osmand.net/map?pin=52.38424,13.18373#15/52.38424/13.18373
Hermann Boost
Standort: geo:52.38835,13.18766?z=15&q=52.38835,13.18766(Hermann+Boost)
https://osmand.net/map?pin=52.38835,13.18766#15/52.38835/13.18766
Hallo Carsten, ich hoffe die GPS Daten sind jetzt korrekt`;

describe('parseManualOSMAndCoordinates', () => {
  it('parses complete OsmAnd coordinate entries and ignores trailing text', () => {
    expect(parseManualOSMAndCoordinates(INPUT)).toEqual([
      {
        name: 'Rudolf Breitscheid',
        koordinaten: { lat: 52.38806, lng: 13.17515 },
        url: 'https://osmand.net/map?pin=52.38806,13.17515#15/52.38806/13.17515',
      },
      {
        name: 'Hanno Günther',
        koordinaten: { lat: 52.38424, lng: 13.18373 },
        url: 'https://osmand.net/map?pin=52.38424,13.18373#15/52.38424/13.18373',
      },
      {
        name: 'Hermann Boost',
        koordinaten: { lat: 52.38835, lng: 13.18766 },
        url: 'https://osmand.net/map?pin=52.38835,13.18766#15/52.38835/13.18766',
      },
    ]);
  });
});

describe('applyManualOSMAndCoordinates', () => {
  it('does not overwrite existing OSM coordinates', () => {
    const backup = {
      pois: [{
        id: 'poi_sws_rudolf-breitscheid',
        typ: 'grab',
        name: { de: 'Rudolf Breitscheid' },
        koordinaten: { lat: 1, lng: 2 },
        koordinaten_quelle: { typ: 'osm', beleg: 'OpenStreetMap: node 1' },
        quellen: [],
        notiz: '',
      }],
    };

    const result = applyManualOSMAndCoordinates(backup, parseManualOSMAndCoordinates(INPUT));
    expect(result.pois[0].koordinaten).toEqual({ lat: 1, lng: 2 });
    expect(result.pois[0].koordinaten_quelle.typ).toBe('osm');
  });

  it('updates non-protected existing coordinate sources to manuell-osmand', () => {
    const backup = {
      pois: [{
        id: 'poi_sws_hanno-guenther',
        typ: 'grab',
        name: { de: 'Hanno Günther' },
        koordinaten: { lat: 1, lng: 2 },
        koordinaten_quelle: { typ: 'manuell-kamera', beleg: 'Kamera-EXIF' },
        quellen: ['Bestandsquelle'],
        notiz: '',
      }],
    };

    const result = applyManualOSMAndCoordinates(backup, parseManualOSMAndCoordinates(INPUT), { datum: '2026-06-06' });
    expect(result.pois[0].koordinaten).toEqual({ lat: 52.38424, lng: 13.18373 });
    expect(result.pois[0].koordinaten_quelle).toEqual({
      typ: 'manuell-osmand',
      beleg: 'inputdata/neue_Koordinaten_über_OSM.txt: Hanno Günther',
      datum: '2026-06-06',
      genauigkeit: 'hoch',
    });
    expect(result.pois[0].quellen).toEqual(['Bestandsquelle']);
    expect(result.pois[0].notiz).toContain('https://osmand.net/map?pin=52.38424,13.18373');
  });

  it('matches alternate manual names for Anita Kupsch and Garnisongrab', () => {
    const input = `Anita Kupsch (Krahn)
Standort: geo:52.39102,13.18236
https://osmand.net/map?pin=52.39102,13.18236
Garnisonsgrab
Standort: geo:52.38951,13.18014
https://osmand.net/map?pin=52.38951,13.18014`;
    const backup = {
      pois: [
        {
          id: 'poi_sws_anita-kupsch',
          typ: 'grab',
          name: { de: 'Anita Kupsch' },
          koordinaten: null,
          koordinaten_quelle: null,
          quellen: [],
          notiz: '',
        },
        {
          id: 'poi_sws_garnisongrab',
          typ: 'bereich',
          name: { de: 'Garnisongrab' },
          koordinaten: null,
          koordinaten_quelle: null,
          quellen: [],
          notiz: '',
        },
      ],
    };

    const result = applyManualOSMAndCoordinates(backup, parseManualOSMAndCoordinates(input), { datum: '2026-08-16' });

    expect(result.manualOSMAndSummary.updated).toHaveLength(2);
    expect(result.pois.find((poi) => poi.id === 'poi_sws_anita-kupsch').koordinaten)
      .toEqual({ lat: 52.39102, lng: 13.18236 });
    expect(result.pois.find((poi) => poi.id === 'poi_sws_garnisongrab').koordinaten)
      .toEqual({ lat: 52.38951, lng: 13.18014 });
  });

  it('adds new POIs for unmatched manual entries', () => {
    const result = applyManualOSMAndCoordinates({ pois: [] }, parseManualOSMAndCoordinates(INPUT), { datum: '2026-06-06' });
    const boost = result.pois.find((poi) => poi.id === 'poi_sws_hermann-boost');

    expect(boost.name.de).toBe('Hermann Boost');
    expect(boost.name.en).toBe('Hermann Boost');
    expect(boost.typ).toBe('grab');
    expect(boost.koordinaten).toEqual({ lat: 52.38835, lng: 13.18766 });
    expect(boost.koordinaten_quelle.typ).toBe('manuell-osmand');
    expect(boost.quellen).toEqual([]);
    expect(boost.notiz).toContain('https://osmand.net/map?pin=52.38835,13.18766');
    expect(boost.publish_status).toBe('veröffentlicht');
  });
});
