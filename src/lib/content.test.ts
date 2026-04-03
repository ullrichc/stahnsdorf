import { describe, test, expect, vi } from 'vitest'

// Mock the JSON data imports before importing the module under test.
// This gives us full control over the test data without loading 200KB+ of real POIs.
vi.mock('../../data/pois.json', () => ({
  default: [
    {
      id: 'poi-valid-exact',
      type: 'grave',
      name: { de: 'Gültiges Grab', en: 'Valid Grave' },
      coordinates: [52.3906, 13.2028] as [number, number],
      coordinates_status: 'exact',
      location_note: { de: '' },
      summary: { de: 'Zusammenfassung' },
      description: { de: 'Beschreibung' },
      dates: {},
      images: [],
      audio: [],
      tags: [],
      categories: [],
      source_refs: [],
      status: 'bestätigt',
      alt_names: [],
      last_reviewed: '2025-01-01',
      image_source_urls: [],
    },
    {
      id: 'poi-valid-approx',
      type: 'monument',
      name: { de: 'Ungefähres Denkmal', en: 'Approximate Monument' },
      coordinates: [52.391, 13.203] as [number, number],
      coordinates_status: 'approximate',
      location_note: { de: '' },
      summary: { de: '' },
      description: { de: '' },
      dates: {},
      images: [],
      audio: [],
      tags: [],
      categories: [],
      source_refs: [],
      status: 'bestätigt',
      alt_names: [],
      last_reviewed: '2025-01-01',
      image_source_urls: [],
    },
    {
      id: 'poi-unknown-status',
      type: 'grave',
      name: { de: 'Unbekannt' },
      coordinates: [52.0, 13.0] as [number, number],
      coordinates_status: 'unknown',
      location_note: { de: '' },
      summary: { de: '' },
      description: { de: '' },
      dates: {},
      images: [],
      audio: [],
      tags: [],
      categories: [],
      source_refs: [],
      status: 'prüfen',
      alt_names: [],
      last_reviewed: '2025-01-01',
      image_source_urls: [],
    },
    {
      id: 'poi-null-coords',
      type: 'building',
      name: { de: 'Null Koordinaten' },
      coordinates: null,
      coordinates_status: 'exact',
      location_note: { de: '' },
      summary: { de: '' },
      description: { de: '' },
      dates: {},
      images: [],
      audio: [],
      tags: [],
      categories: [],
      source_refs: [],
      status: 'unsicher',
      alt_names: [],
      last_reviewed: '2025-01-01',
      image_source_urls: [],
    },
  ],
}))

vi.mock('../../data/collections.json', () => ({
  default: [
    {
      id: 'col-1',
      name: { de: 'Sammlung Eins', en: 'Collection One' },
      summary: { de: 'Erste Sammlung' },
      description: { de: '' },
      // References both valid and invalid (filtered-out) POIs
      pois: ['poi-valid-exact', 'poi-unknown-status', 'poi-null-coords', 'poi-valid-approx'],
      tags: ['test'],
      status: 'bestätigt',
      last_reviewed: '2025-01-01',
    },
    {
      id: 'col-2',
      name: { de: 'Leere Sammlung' },
      summary: { de: '' },
      description: { de: '' },
      // Only references POIs that will be filtered out
      pois: ['poi-unknown-status', 'poi-null-coords'],
      tags: [],
      status: 'bestätigt',
      last_reviewed: '2025-01-01',
    },
  ],
}))

import { getAllPOIs, getPOIById, getAllCollections, getCollectionById } from './content'

// ─── getAllPOIs ───────────────────────────────────────────────

describe('getAllPOIs', () => {
  test('never returns POIs with coordinates_status "unknown"', () => {
    const pois = getAllPOIs()
    expect(pois.every(p => p.coordinates_status !== 'unknown')).toBe(true)
  })

  test('never returns POIs with coordinates: null', () => {
    const pois = getAllPOIs()
    expect(pois.every(p => p.coordinates !== null)).toBe(true)
  })

  test('returns only the two valid POIs from test data', () => {
    const pois = getAllPOIs()
    expect(pois).toHaveLength(2)
    const ids = pois.map(p => p.id)
    expect(ids).toContain('poi-valid-exact')
    expect(ids).toContain('poi-valid-approx')
  })
})

// ─── getPOIById ──────────────────────────────────────────────

describe('getPOIById', () => {
  test('returns POI for a valid ID', () => {
    const poi = getPOIById('poi-valid-exact')
    expect(poi).toBeDefined()
    expect(poi!.id).toBe('poi-valid-exact')
    expect(poi!.name.de).toBe('Gültiges Grab')
  })

  test('returns undefined for an unknown ID', () => {
    expect(getPOIById('does-not-exist')).toBeUndefined()
  })

  test('returns undefined for a filtered-out POI ID', () => {
    // This POI exists in raw data but is filtered due to coordinates_status: 'unknown'
    expect(getPOIById('poi-unknown-status')).toBeUndefined()
  })
})

// ─── getAllCollections ────────────────────────────────────────

describe('getAllCollections', () => {
  test('removes POI refs that point to filtered-out POIs (ghost pointer scrub)', () => {
    const collections = getAllCollections()
    const col1 = collections.find(c => c.id === 'col-1')!
    // Original had 4 POI refs; two should be scrubbed (unknown + null-coords)
    expect(col1.pois).toHaveLength(2)
    expect(col1.pois).toContain('poi-valid-exact')
    expect(col1.pois).toContain('poi-valid-approx')
    expect(col1.pois).not.toContain('poi-unknown-status')
    expect(col1.pois).not.toContain('poi-null-coords')
  })

  test('collection with only invalid POI refs ends up with empty pois array', () => {
    const collections = getAllCollections()
    const col2 = collections.find(c => c.id === 'col-2')!
    expect(col2.pois).toHaveLength(0)
  })

  test('preserves other collection fields after scrubbing', () => {
    const collections = getAllCollections()
    const col1 = collections.find(c => c.id === 'col-1')!
    expect(col1.name.de).toBe('Sammlung Eins')
    expect(col1.tags).toEqual(['test'])
  })
})

// ─── getCollectionById ───────────────────────────────────────

describe('getCollectionById', () => {
  test('returns collection for a valid ID', () => {
    const col = getCollectionById('col-1')
    expect(col).toBeDefined()
    expect(col!.id).toBe('col-1')
  })

  test('returns undefined for an unknown ID', () => {
    expect(getCollectionById('does-not-exist')).toBeUndefined()
  })

  test('scrubs ghost pointers in returned collection', () => {
    const col = getCollectionById('col-1')!
    expect(col.pois).toHaveLength(2)
    expect(col.pois).not.toContain('poi-unknown-status')
  })
})
