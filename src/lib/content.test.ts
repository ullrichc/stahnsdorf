import { describe, test, expect } from 'vitest'
import backupData from '../../data/stahnsdorf-backup-translated.json'
import { getAllPOIs, getPOIById, getAllCollections, getCollectionById } from './content'

const snapshotPois = backupData.pois as any[]
const snapshotCollections = backupData.collections as any[]
const expectedMappedPoiIds = new Set(
  snapshotPois.filter((poi) => poi.koordinaten !== null).map((poi) => poi.id),
)

// ─── getAllPOIs ───────────────────────────────────────────────

describe('getAllPOIs', () => {
  test('returns all snapshot POIs with coordinates', () => {
    const pois = getAllPOIs()
    expect(pois).toHaveLength(expectedMappedPoiIds.size)
    expect(pois.every((poi) => poi.koordinaten !== null)).toBe(true)
  })
})

// ─── getPOIById ──────────────────────────────────────────────

describe('getPOIById', () => {
  test('finds a mapped POI by ID', () => {
    const expected = snapshotPois.find((poi) => poi.koordinaten !== null)!
    const poi = getPOIById(expected.id)
    expect(poi).toBeDefined()
    expect(poi!.id).toBe(expected.id)
    expect(poi!.name.de).toBe(expected.name.de)
  })

  test('returns undefined for unknown ID', () => {
    expect(getPOIById('gibt-es-nicht')).toBeUndefined()
  })

  test('returns undefined for a POI without coordinates', () => {
    const withoutCoords = snapshotPois.find((poi) => poi.koordinaten === null)
    if (!withoutCoords) return
    expect(getPOIById(withoutCoords.id)).toBeUndefined()
  })
})

describe('tree grave location hints', () => {
  const expectedTreeNumbers = [
    ['poi_sws_juergen-kluckert', 'Baum Nr. 1357A'],
    ['poi_sws_maja-maranow', 'Baum Nr. 1635'],
    ['poi_sws_arne-elsholtz', 'Baum Nr. 1611'],
    ['poi_sws_manfred-krug', 'Baum Nr. 1829'],
    ['poi_sws_guenther-heidemann', 'Baum Nr. 135'],
    ['poi_sws_ingrid-steeger', 'Baum Nr. 482'],
  ] as const

  test.each(expectedTreeNumbers)('%s exposes %s as visible location hint', (poiId, treeNumber) => {
    const poi = snapshotPois.find((item) => item.id === poiId)
    expect(poi?.lagehinweis).toContain(treeNumber)
  })
})

// ─── getAllCollections ────────────────────────────────────────

describe('getAllCollections', () => {
  test('returns all snapshot collections', () => {
    const collections = getAllCollections()
    expect(collections).toHaveLength(snapshotCollections.length)
  })

  test('filters collection references to mapped POIs only', () => {
    for (const collection of getAllCollections()) {
      expect(collection.pois.every((poiId) => expectedMappedPoiIds.has(poiId))).toBe(true)
    }
  })

  test('preserves other collection fields after filtering', () => {
    const expected = snapshotCollections[0]
    const collection = getAllCollections().find((item) => item.id === expected.id)!
    expect(collection.name.de).toBe(expected.name.de)
  })
})

// ─── getCollectionById ───────────────────────────────────────

describe('getCollectionById', () => {
  test('finds a collection by valid ID', () => {
    const expected = snapshotCollections[0]
    const collection = getCollectionById(expected.id)
    expect(collection).toBeDefined()
    expect(collection!.id).toBe(expected.id)
  })

  test('returns undefined for unknown ID', () => {
    expect(getCollectionById('gibt-es-nicht')).toBeUndefined()
  })

  test('filters invalid POI references in returned collection', () => {
    const expected = snapshotCollections[0]
    const collection = getCollectionById(expected.id)!
    expect(collection.pois.every((poiId) => expectedMappedPoiIds.has(poiId))).toBe(true)
  })
})
