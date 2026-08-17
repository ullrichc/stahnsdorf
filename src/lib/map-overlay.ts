import type { PathOptions } from 'leaflet'
import { resolveAppPath } from './app-path'

export type MapOverlayProperties = {
  kind?: 'cemetery' | 'path'
  highway?: string
  service?: string
}

type LatLng = {
  lat: number
  lng: number
}

// OSM way 25029213, also used as the cemetery feature in map-overlay.geojson.
const CEMETERY_BOUNDARY: ReadonlyArray<readonly [number, number]> = [
  [13.186771, 52.391542],
  [13.179748, 52.39142],
  [13.172189, 52.391288],
  [13.17223, 52.390603],
  [13.172284, 52.390134],
  [13.172437, 52.389556],
  [13.172649, 52.388974],
  [13.172917, 52.388506],
  [13.17321, 52.387731],
  [13.173378, 52.387064],
  [13.173349, 52.386162],
  [13.172755, 52.384584],
  [13.172238, 52.383798],
  [13.171976, 52.383099],
  [13.17093, 52.381507],
  [13.170356, 52.381572],
  [13.170382, 52.38148],
  [13.170496, 52.381363],
  [13.170767, 52.381267],
  [13.171988, 52.380837],
  [13.17323, 52.380317],
  [13.175036, 52.380707],
  [13.181169, 52.38162],
  [13.183537, 52.382226],
  [13.191425, 52.384342],
  [13.188742, 52.38735],
  [13.190082, 52.387823],
  [13.189106, 52.388874],
]

export function isInsideCemetery(point: LatLng): boolean {
  let inside = false

  for (let i = 0, j = CEMETERY_BOUNDARY.length - 1; i < CEMETERY_BOUNDARY.length; j = i++) {
    const [lngI, latI] = CEMETERY_BOUNDARY[i]
    const [lngJ, latJ] = CEMETERY_BOUNDARY[j]
    const crossesLatitude = (latI > point.lat) !== (latJ > point.lat)
    const boundaryLng = ((lngJ - lngI) * (point.lat - latI)) / (latJ - latI) + lngI

    if (crossesLatitude && point.lng < boundaryLng) inside = !inside
  }

  return inside
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
