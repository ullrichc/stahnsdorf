import L from 'leaflet'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { LucideProps } from 'lucide-react'
import { Church, Flame, Landmark, MapPin, Signpost, Trees } from 'lucide-react'
import { POI } from '@/lib/types'

const markerIcons: Record<string, ComponentType<LucideProps>> = {
  grab: MapPin,
  bauwerk: Church,
  bereich: Trees,
  denkmal: Landmark,
  mausoleum: Landmark,
  gedenkanlage: Flame,
}

export function createMarkerIcon(
  poi: POI,
  { compact = false, selected = false }: { compact?: boolean; selected?: boolean } = {},
): L.DivIcon {
  const compactSize = compact && !selected
  const size = compactSize ? 20 : 48
  const Icon = markerIcons[poi.typ] ?? Signpost
  const iconMarkup = compactSize
    ? ''
    : renderToStaticMarkup(createElement(Icon, {
        size: 22,
        strokeWidth: 1.8,
        'aria-hidden': true,
      }))

  return L.divIcon({
    html: `
      <div data-poi-id="${poi.id}" class="marker-wrapper${compactSize ? ' marker-wrapper--compact' : ''}${selected ? ' marker-wrapper--selected' : ''}">
        <div class="custom-marker marker-${poi.typ}">
          ${iconMarkup}
        </div>
      </div>
    `,
    className: 'marker-container',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}
