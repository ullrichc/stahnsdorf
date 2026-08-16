export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

import type { Koordinaten } from './types'

export function formatDistance(meters: number, immediateLabel = 'Gerade hier'): string {
  if (meters < 10) return immediateLabel
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function isValidCoordinates(value: unknown): value is Koordinaten {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<Koordinaten>
  return typeof candidate.lat === 'number'
    && typeof candidate.lng === 'number'
    && Number.isFinite(candidate.lat)
    && Number.isFinite(candidate.lng)
    && candidate.lat >= -90
    && candidate.lat <= 90
    && candidate.lng >= -180
    && candidate.lng <= 180
}

export function parseCoordinatePair(latValue: string, lngValue: string): Koordinaten | null {
  const latText = latValue.trim()
  const lngText = lngValue.trim()

  if (!latText && !lngText) return null
  if (!latText || !lngText) {
    throw new Error('Breiten- und Längengrad müssen vollständig angegeben werden.')
  }

  const coordinates = { lat: Number(latText), lng: Number(lngText) }
  if (!Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) {
    throw new Error('Koordinaten müssen gültige Zahlen sein.')
  }
  if (!isValidCoordinates(coordinates)) {
    throw new Error('Koordinaten liegen außerhalb des gültigen Bereichs.')
  }

  return coordinates
}
