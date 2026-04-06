import { POI, Collection } from './types'
import backupData from '../../data/stahnsdorf-backup-translated.json'

// Veraltet: JSON-basierte Loader (nur noch für ältere Tests)
export const getPOIs = (): POI[] => {
  return backupData.pois as POI[]
}

export const getCollections = (): Collection[] => {
  return backupData.collections as Collection[]
}

export function getAllPOIs(): POI[] {
  return getPOIs().filter(poi => poi.koordinaten !== null)
}

export function getPOIById(id: string): POI | undefined {
  return getAllPOIs().find(poi => poi.id === id)
}

export function getAllCollections(): Collection[] {
  const collections = getCollections()
  return collections.map(collection => ({
    ...collection,
    pois: collection.pois.filter(poiId => getAllPOIs().some(p => p.id === poiId))
  }))
}

export function getCollectionById(id: string): Collection | undefined {
  const collection = getCollections().find(c => c.id === id)
  if (!collection) return undefined;

  return {
    ...collection,
    pois: collection.pois.filter(poiId => getAllPOIs().some(p => p.id === poiId))
  }
}
