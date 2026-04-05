import { describe, test, expect, vi } from 'vitest'

// Mock-Daten im neuen Schema (docs/schema.md)
vi.mock('../../data/pois.json', () => ({
  default: [
    {
      id: 'poi-valid-exact',
      typ: 'grab',
      name: { de: 'Gültiges Grab', en: 'Valid Grave' },
      koordinaten: { lat: 52.3906, lng: 13.2028 },
      kurztext: { de: 'Zusammenfassung' },
      beschreibung: { de: 'Beschreibung' },
      bilder: [],
      audio: {},
      quellen: [],
      status: 'bestätigt',
    },
    {
      id: 'poi-valid-approx',
      typ: 'denkmal',
      name: { de: 'Ungefähres Denkmal', en: 'Approximate Monument' },
      koordinaten: { lat: 52.391, lng: 13.203 },
      kurztext: { de: '' },
      beschreibung: { de: '' },
      bilder: [],
      audio: {},
      quellen: [],
      status: 'bestätigt',
      notiz: 'Koordinaten nur angenähert.',
    },
    {
      id: 'poi-ohne-koordinaten',
      typ: 'grab',
      name: { de: 'Ohne Koordinaten' },
      koordinaten: null,
      kurztext: { de: '' },
      beschreibung: { de: '' },
      bilder: [],
      audio: {},
      quellen: [],
      status: 'prüfen',
      notiz: 'Block Trinitatis. Koordinaten vor Ort ermitteln.',
    },
  ],
}))

vi.mock('../../data/collections.json', () => ({
  default: [
    {
      id: 'col-1',
      name: { de: 'Sammlung Eins', en: 'Collection One' },
      kurztext: { de: 'Erste Sammlung' },
      beschreibung: { de: '' },
      pois: ['poi-valid-exact', 'poi-ohne-koordinaten', 'poi-valid-approx'],
      status: 'bestätigt',
    },
    {
      id: 'col-2',
      name: { de: 'Leere Sammlung' },
      kurztext: { de: '' },
      beschreibung: { de: '' },
      pois: ['poi-ohne-koordinaten'],
      status: 'bestätigt',
    },
  ],
}))

import { getAllPOIs, getPOIById, getAllCollections, getCollectionById } from './content'

// ─── getAllPOIs ───────────────────────────────────────────────

describe('getAllPOIs', () => {
  test('gibt nie POIs ohne Koordinaten zurück', () => {
    const pois = getAllPOIs()
    expect(pois.every(p => p.koordinaten !== null)).toBe(true)
  })

  test('gibt nur die zwei POIs mit Koordinaten zurück', () => {
    const pois = getAllPOIs()
    expect(pois).toHaveLength(2)
    const ids = pois.map(p => p.id)
    expect(ids).toContain('poi-valid-exact')
    expect(ids).toContain('poi-valid-approx')
  })
})

// ─── getPOIById ──────────────────────────────────────────────

describe('getPOIById', () => {
  test('findet einen POI mit gültiger ID', () => {
    const poi = getPOIById('poi-valid-exact')
    expect(poi).toBeDefined()
    expect(poi!.id).toBe('poi-valid-exact')
    expect(poi!.name.de).toBe('Gültiges Grab')
  })

  test('gibt undefined für unbekannte ID', () => {
    expect(getPOIById('gibt-es-nicht')).toBeUndefined()
  })

  test('gibt undefined für herausgefilterte POI-ID', () => {
    expect(getPOIById('poi-ohne-koordinaten')).toBeUndefined()
  })
})

// ─── getAllCollections ────────────────────────────────────────

describe('getAllCollections', () => {
  test('entfernt POI-Referenzen auf herausgefilterte POIs', () => {
    const collections = getAllCollections()
    const col1 = collections.find(c => c.id === 'col-1')!
    expect(col1.pois).toHaveLength(2)
    expect(col1.pois).toContain('poi-valid-exact')
    expect(col1.pois).toContain('poi-valid-approx')
    expect(col1.pois).not.toContain('poi-ohne-koordinaten')
  })

  test('Collection mit nur ungültigen POI-Referenzen hat leeres pois-Array', () => {
    const collections = getAllCollections()
    const col2 = collections.find(c => c.id === 'col-2')!
    expect(col2.pois).toHaveLength(0)
  })

  test('bewahrt andere Collection-Felder nach dem Filtern', () => {
    const collections = getAllCollections()
    const col1 = collections.find(c => c.id === 'col-1')!
    expect(col1.name.de).toBe('Sammlung Eins')
  })
})

// ─── getCollectionById ───────────────────────────────────────

describe('getCollectionById', () => {
  test('findet eine Collection mit gültiger ID', () => {
    const col = getCollectionById('col-1')
    expect(col).toBeDefined()
    expect(col!.id).toBe('col-1')
  })

  test('gibt undefined für unbekannte ID', () => {
    expect(getCollectionById('gibt-es-nicht')).toBeUndefined()
  })

  test('filtert ungültige POI-Referenzen in zurückgegebener Collection', () => {
    const col = getCollectionById('col-1')!
    expect(col.pois).toHaveLength(2)
    expect(col.pois).not.toContain('poi-ohne-koordinaten')
  })
})
