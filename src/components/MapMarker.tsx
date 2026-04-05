import L from 'leaflet'
import { POI } from '@/lib/types'

const markerIcons: Record<string, string> = {
  grab: '\u{1FAA6}',
  bauwerk: '\u26EA',
  bereich: '\u{1F4CC}',
  denkmal: '\u{1F3DB}',
  mausoleum: '\u{1F3DB}',
  gedenkanlage: '\u{1F56F}',
}

export function createMarkerIcon(poi: POI): L.DivIcon {
  return L.divIcon({
    html: `
      <div class="marker-wrapper">
        <div class="custom-marker marker-${poi.typ}">
          <span style="font-size:1.8rem; line-height:1;">${markerIcons[poi.typ] || markerIcons['bereich']}</span>
        </div>
      </div>
    `,
    className: 'marker-container',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}
