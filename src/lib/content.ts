import { POI, Tour } from './types'
import poisData from '../../data/pois.json'
import toursData from '../../data/tours.json'

const pois: POI[] = poisData as POI[]
const tours: Tour[] = toursData as Tour[]

export function getAllPOIs(): POI[] {
  return pois
}

export function getPOIById(id: string): POI | undefined {
  return pois.find((p) => p.id === id)
}

export function getAllTours(): Tour[] {
  return tours
}

export function getTourById(id: string): Tour | undefined {
  return tours.find((t) => t.id === id)
}
