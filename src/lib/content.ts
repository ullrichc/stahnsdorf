import poisData from '../../data/pois.json'
import collectionsData from '../../data/collections.json'
import { POI, Collection } from './types'

// Nur POIs mit Koordinaten erscheinen in der App
const validPOIs = (poisData as unknown as POI[]).filter(poi => poi.koordinaten !== null)

export function getAllPOIs(): POI[] {
  return validPOIs
}

export function getPOIById(id: string): POI | undefined {
  return validPOIs.find(poi => poi.id === id)
}

export function getAllCollections(): Collection[] {
  const collections = collectionsData as unknown as Collection[]
  return collections.map(collection => ({
    ...collection,
    pois: collection.pois.filter(poiId => validPOIs.some(p => p.id === poiId))
  }))
}

export function getCollectionById(id: string): Collection | undefined {
  const collection = (collectionsData as unknown as Collection[]).find(c => c.id === id)
  if (!collection) return undefined;

  return {
    ...collection,
    pois: collection.pois.filter(poiId => validPOIs.some(p => p.id === poiId))
  }
}
