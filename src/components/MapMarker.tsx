import L from 'leaflet'
import { POIType } from '@/lib/types'

const markerIcons: Record<POIType, string> = {
  grave: '\u{1FAA6}',
  building: '\u26EA',
  landmark: '\u{1F4CC}',
  nature: '\u{1F333}',
}

export function createMarkerIcon(type: POIType): L.DivIcon {
  return L.divIcon({
    html: `<span style="font-size:1.5rem">${markerIcons[type]}</span>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}
