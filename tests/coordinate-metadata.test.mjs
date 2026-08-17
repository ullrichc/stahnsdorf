import { describe, expect, it } from 'vitest';
import {
  backfillCoordinateMetadata,
  extractLagehinweis,
  inferCoordinateSource,
} from '../scripts/coordinate-metadata.mjs';

describe('inferCoordinateSource', () => {
  it('detects OSM coordinates from sources and notes', () => {
    const source = inferCoordinateSource({
      koordinaten: { lat: 52.3880655, lng: 13.1751195 },
      quellen: ['OpenStreetMap: node 3524525179, https://www.openstreetmap.org/node/3524525179, Version 5, Stand 2023-02-03T15:42:26Z, abgerufen 2026-05-25'],
      notiz: 'OSM-Koordinate übernommen (node 3524525179).',
    });

    expect(source).toEqual({
      typ: 'osm',
      beleg: 'OpenStreetMap: node 3524525179',
      datum: '2026-05-25',
      genauigkeit: 'hoch',
    });
  });

  it('detects wo-sie-ruhen coordinates from source and location notes', () => {
    const source = inferCoordinateSource({
      koordinaten: { lat: 52.387747, lng: 13.177103 },
      quellen: ['wo-sie-ruhen.de'],
      notiz: 'Quelle: wo-sie-ruhen.de. Lage: Block Trinitatis, Feld 10, Wahlstelle 64. Ehrengrab: nein.',
    });

    expect(source).toEqual({
      typ: 'wo-sie-ruhen',
      beleg: 'wo-sie-ruhen.de',
      genauigkeit: 'hoch',
    });
  });

  it('detects manually captured camera EXIF coordinates', () => {
    const source = inferCoordinateSource({
      koordinaten: { lat: 52.386715, lng: 13.181438 },
      quellen: [],
      notiz: 'Koordinate aus Kamera-EXIF, vor Ort prüfen.',
    });

    expect(source?.typ).toBe('manuell-kamera');
    expect(source?.genauigkeit).toBe('mittel');
  });

  it('detects old stock coordinates', () => {
    const source = inferCoordinateSource({
      koordinaten: { lat: 52.3885935, lng: 13.1890989 },
      quellen: [],
      notiz: 'Bestandskoordinate aus der Ausgangsdatei übernommen.',
    });

    expect(source?.typ).toBe('altbestand');
    expect(source?.genauigkeit).toBe('niedrig');
  });

  it('omits coordinate source when coordinates are missing', () => {
    expect(inferCoordinateSource({ koordinaten: null, quellen: [], notiz: '' })).toBeNull();
  });
});

describe('extractLagehinweis', () => {
  it('extracts wo-sie-ruhen location hints from existing notes', () => {
    expect(extractLagehinweis('Lage laut wo-sie-ruhen.de: Block Lietzensee, Feld 22, Wahlstelle 115 OSM-Koordinate übernommen (node 1).')).toEqual({
      lagehinweis: 'Block Lietzensee, Feld 22, Wahlstelle 115',
      lagehinweis_quelle: 'wo-sie-ruhen.de',
    });
  });

  it('keeps abbreviations with periods inside location hints', () => {
    expect(extractLagehinweis('Lage laut wo-sie-ruhen.de: Alte Umbettung, Abt. C, Erbb. 127')).toEqual({
      lagehinweis: 'Alte Umbettung, Abt. C, Erbb. 127',
      lagehinweis_quelle: 'wo-sie-ruhen.de',
    });
  });

  it('extracts location hints from imported wo-sie-ruhen notes', () => {
    expect(extractLagehinweis('Quelle: wo-sie-ruhen.de. Lage: Block Schöneberg, Feld 8, Wahlstelle 276. Ehrengrab: nein.')).toEqual({
      lagehinweis: 'Block Schöneberg, Feld 8, Wahlstelle 276',
      lagehinweis_quelle: 'wo-sie-ruhen.de',
    });
  });
});

describe('backfillCoordinateMetadata', () => {
  it('adds coordinate source and location hint without removing existing data', () => {
    const result = backfillCoordinateMetadata({
      pois: [{
        id: 'poi_sws_test',
        koordinaten: { lat: 52.0, lng: 13.0 },
        quellen: ['wo-sie-ruhen.de'],
        notiz: 'Quelle: wo-sie-ruhen.de. Lage: Block Test, Feld 1. Ehrengrab: nein.',
      }],
      collections: [],
    });

    expect(result.pois[0].koordinaten_quelle.typ).toBe('wo-sie-ruhen');
    expect(result.pois[0].lagehinweis).toBe('Block Test, Feld 1');
    expect(result.pois[0].quellen).toHaveLength(1);
  });
}
);
