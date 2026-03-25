import L from 'leaflet'
import { POI } from '@/lib/types'

const markerIcons: Record<string, string> = {
  grave: '\u{1FAA6}',
  building: '\u26EA',
  landmark: '\u{1F4CC}',
  nature: '\u{1F333}',
}

import { t } from '@/lib/i18n'

function getClientLocale(): string {
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0]
    return ['de', 'en', 'fr'].includes(browserLang) ? browserLang : 'de'
  }
  return 'de'
}

export function createMarkerIcon(poi: POI): L.DivIcon {
  const locale = getClientLocale()
  return L.divIcon({
    html: `
      <div class="marker-wrapper">
        <div class="custom-marker marker-${poi.type}">
          <span style="font-size:1.8rem; line-height:1;">${markerIcons[poi.type] || markerIcons['landmark']}</span>
        </div>
        <div class="marker-label">${t(poi.name, locale)}</div>
      </div>
    `,
    className: 'marker-container',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}
