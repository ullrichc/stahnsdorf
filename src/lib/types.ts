export type LocalizedString = {
  de: string
  en?: string
}

export type POIType = 'grave' | 'building' | 'landmark' | 'nature'

export type POI = {
  id: string
  type: POIType
  name: LocalizedString
  coordinates: [number, number] // [lat, lng]
  summary: LocalizedString
  description: LocalizedString
  dates?: { born?: string; died?: string }
  images: string[]
  audio?: LocalizedString
  tags: string[]
}

export type TourStop = {
  poiId: string
  order: number
  transition: LocalizedString
}

export type Tour = {
  id: string
  name: LocalizedString
  description: LocalizedString
  duration: string
  distance: string
  stops: TourStop[]
}
