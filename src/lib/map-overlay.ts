import type { PathOptions } from 'leaflet'
import { resolveAppPath } from './app-path'

export type MapOverlayProperties = {
  kind?: 'cemetery' | 'path'
  highway?: string
  service?: string
}

export function mapOverlayAssetPath(): string {
  return resolveAppPath('/map-overlay.geojson')
}

export function isOverlayFeatureVisible(properties: MapOverlayProperties, zoom: number): boolean {
  if (properties.kind === 'cemetery') return true
  if (properties.kind !== 'path') return false
  if (properties.highway === 'service' || properties.highway === 'pedestrian') return zoom >= 15
  return zoom >= 17
}

export function getOverlayFeatureStyle(
  properties: MapOverlayProperties,
  zoom: number,
): PathOptions {
  if (properties.kind === 'cemetery') {
    return {
      pane: 'cemeteryOverlayPane',
      color: '#c4aa72',
      opacity: zoom < 15 ? 0.72 : 0.58,
      weight: zoom < 15 ? 1.8 : 1.35,
      fill: true,
      fillColor: '#28513a',
      fillOpacity: 0.18,
      interactive: false,
    }
  }

  const visible = isOverlayFeatureVisible(properties, zoom)
  const mainPath = properties.highway === 'service' || properties.highway === 'pedestrian'
  return {
    pane: 'pathOverlayPane',
    color: mainPath ? '#c9c1ad' : '#b5b1a7',
    opacity: visible ? (mainPath ? 0.64 : 0.46) : 0,
    weight: visible ? (mainPath ? 2.25 : 1.25) : 0,
    lineCap: 'round',
    lineJoin: 'round',
    fill: false,
    interactive: false,
  }
}

