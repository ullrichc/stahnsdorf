'use client'

import { useEffect } from 'react'
import L from 'leaflet'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { useMapInstance } from './ClientMap'
import {
  getOverlayFeatureStyle,
  mapOverlayAssetPath,
  type MapOverlayProperties,
} from '@/lib/map-overlay'

type OverlayFeature = Feature<Geometry, MapOverlayProperties>

export default function MapOverlay() {
  const map = useMapInstance()

  useEffect(() => {
    const cemeteryPane = map.getPane('cemeteryOverlayPane') ?? map.createPane('cemeteryOverlayPane')
    const pathPane = map.getPane('pathOverlayPane') ?? map.createPane('pathOverlayPane')
    cemeteryPane.style.zIndex = '250'
    pathPane.style.zIndex = '300'
    cemeteryPane.dataset.mapOverlayState = 'loading'

    const controller = new AbortController()
    let layer: L.GeoJSON | null = null
    let disposed = false

    const styleFeature = (feature?: OverlayFeature) => (
      getOverlayFeatureStyle(feature?.properties ?? {}, map.getZoom())
    )
    const updateStyles = () => layer?.setStyle(styleFeature)

    async function loadOverlay() {
      try {
        const response = await fetch(mapOverlayAssetPath(), {
          cache: 'force-cache',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json() as FeatureCollection<Geometry, MapOverlayProperties>
        if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
          throw new Error('Ungültiges GeoJSON')
        }
        if (disposed) return

        layer = L.geoJSON(data, {
          interactive: false,
          style: styleFeature,
        }).addTo(map)
        map.on('zoomend', updateStyles)
        cemeteryPane.dataset.mapOverlayState = 'loaded'
      } catch (error) {
        if (controller.signal.aborted) return
        cemeteryPane.dataset.mapOverlayState = 'error'
        console.warn('Karten-Overlay konnte nicht geladen werden.', error)
      }
    }

    void loadOverlay()

    return () => {
      disposed = true
      controller.abort()
      map.off('zoomend', updateStyles)
      layer?.remove()
      delete cemeteryPane.dataset.mapOverlayState
    }
  }, [map])

  return null
}

