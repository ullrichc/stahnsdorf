import L from 'leaflet'
import { POI } from '@/lib/types'

const markerIcons: Record<string, string> = {
  grave: '\u{1FAA6}',
  building: '\u26EA',
  landmark: '\u{1F4CC}',
  nature: '\u{1F333}',
}

export function createMarkerIcon(poi: POI): L.DivIcon {
  return L.divIcon({
    html: `
      <div class="marker-wrapper">
        <div class="custom-marker marker-${poi.type}">
          <span style="font-size:1.8rem; line-height:1;">${markerIcons[poi.type] || markerIcons['landmark']}</span>
        </div>
      </div>
    `,
    className: 'marker-container',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}
