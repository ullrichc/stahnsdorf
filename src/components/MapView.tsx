'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import ClientMap, { useMapInstance } from './ClientMap'
import { usePOIs } from '@/lib/useFirestore'
import { Koordinaten, POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { createMarkerIcon } from './MapMarker'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'
import { readStoredMapView, writeStoredMapView } from '@/lib/map-view-state'
import POICard from './POICard'
import styles from './MapView.module.css'
import { isValidCoordinates } from '@/lib/geo'
import AppIcon from './AppIcon'

const CENTER: [number, number] = [52.389506, 13.180954]
const ZOOM = 16

function getInitialMapView(restore: boolean): { center: [number, number], zoom: number } {
  if (!restore || typeof window === 'undefined') return { center: CENTER, zoom: ZOOM }

  const stored = readStoredMapView(window.sessionStorage)
  if (!stored) return { center: CENTER, zoom: ZOOM }

  return { center: [stored.lat, stored.lng], zoom: stored.zoom }
}

function PersistMapView({ enabled }: { enabled: boolean }) {
  const map = useMapInstance()

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const save = () => {
      const center = map.getCenter()
      writeStoredMapView(window.sessionStorage, {
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom(),
      })
    }

    map.on('moveend zoomend', save)
    save()

    return () => {
      map.off('moveend zoomend', save)
    }
  }, [enabled, map])

  return null
}

function LocateButton() {
  const map = useMapInstance()
  const markerRef = useRef<L.CircleMarker | null>(null)
  const accuracyRef = useRef<L.Circle | null>(null)
  const firstFixRef = useRef(true)
  const [tracking, setTracking] = useState(false)
  const [error, setError] = useState(false)
  const locale = useLocale()
  const dict = useDictionary(locale)

  useEffect(() => {
    const handleFound = (event: L.LocationEvent) => {
      if (markerRef.current) {
        markerRef.current.remove()
      }
      if (accuracyRef.current) {
        accuracyRef.current.remove()
      }
      markerRef.current = L.circleMarker(event.latlng, {
        radius: 8,
        fillColor: '#4285f4',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2,
      }).addTo(map)
      accuracyRef.current = L.circle(event.latlng, {
        radius: event.accuracy,
        color: '#4285f4',
        fillColor: '#4285f4',
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(map)
      setError(false)

      if (firstFixRef.current) {
        map.setView(event.latlng, Math.max(map.getZoom(), 17))
        firstFixRef.current = false
      }
    }

    const handleError = () => {
      map.stopLocate()
      setTracking(false)
      setError(true)
    }
    map.on('locationfound', handleFound)
    map.on('locationerror', handleError)

    return () => {
      map.stopLocate()
      map.off('locationfound', handleFound)
      map.off('locationerror', handleError)
      markerRef.current?.remove()
      accuracyRef.current?.remove()
    }
  }, [map])

  const handleLocate = useCallback(() => {
    if (tracking) {
      map.stopLocate()
      setTracking(false)
      return
    }

    firstFixRef.current = true
    setError(false)
    setTracking(true)
    map.locate({
      watch: true,
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 30000,
    })
  }, [map, tracking])

  return (
    <div className={styles.locateWrap}>
      {error && <div className={styles.locateError} role="status">{dict.locationError}</div>}
      <button
        className={styles.locate}
        onClick={handleLocate}
        aria-label={dict.locate}
        aria-pressed={tracking}
      >
        <AppIcon name="my_location" />
      </button>
    </div>
  )
}

function POIMarkers({ pois, onSelect, poiIds, locale }: { pois: POI[], onSelect: (poi: POI) => void, poiIds?: string[], locale: string }) {
  const map = useMapInstance()
  const filtered = poiIds ? pois.filter(p => poiIds.includes(p.id)) : pois

  useEffect(() => {
    // Guard against Leaflet HMR race: if the map pane is gone, skip
    if (!map.getPane('markerPane')) return

    const validPOIs = filtered.filter(
      (poi): poi is POI & { koordinaten: Koordinaten } => isValidCoordinates(poi.koordinaten),
    )
    const markers = validPOIs.map((poi) => {
      const coords: [number, number] = [poi.koordinaten.lat, poi.koordinaten.lng]
      const marker = L.marker(coords, { icon: createMarkerIcon(poi) })
      marker.on('click', () => onSelect(poi))
      marker.bindTooltip(t(poi.name, locale), {
        permanent: true,
        interactive: true,
        direction: 'right',
        offset: [18, 0],
        className: 'poi-tooltip',
      })
      marker.getTooltip()?.on('click', () => onSelect(poi))
      marker.addTo(map)
      return marker
    })

    let isZoomedIn = map.getZoom() >= 17

    const setTooltipOpacity = (m: L.Marker, visible: boolean) => {
      const el = m.getTooltip()?.getElement()
      if (el) {
        el.style.opacity = visible ? '1' : '0'
        el.style.pointerEvents = visible ? 'auto' : 'none'
      }
    }

    const updateTooltipVisibility = () => {
      isZoomedIn = map.getZoom() >= 17
      markers.forEach((m) => setTooltipOpacity(m, isZoomedIn))
    }

    // Show tooltip on hover/touch when zoomed out
    markers.forEach((m) => {
      m.on('mouseover', () => { if (!isZoomedIn) setTooltipOpacity(m, true) })
      m.on('mouseout',  () => { if (!isZoomedIn) setTooltipOpacity(m, false) })
    })
    
    updateTooltipVisibility() // Initial state
    map.on('zoomend', updateTooltipVisibility)

    if (poiIds && filtered.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 17 });
    }

    return () => {
      map.off('zoomend', updateTooltipVisibility)
      markers.forEach((m) => m.remove())
    }
  }, [map, filtered, onSelect, locale])

  return null
}

function SearchOverlay({ pois, onSelect }: { pois: POI[], onSelect: (poi: POI) => void }) {
  const map = useMapInstance()
  const locale = useLocale()
  const dict = useDictionary(locale)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<POI[]>([])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const lower = query.toLowerCase()
    const matches = pois.filter(p => 
      (p.name && p.name.de && p.name.de.toLowerCase().includes(lower)) ||
      (p.name && p.name.en && p.name.en.toLowerCase().includes(lower)) ||
      (p.name && p.name.fr && p.name.fr.toLowerCase().includes(lower)) ||
      (p.name && p.name.pl && p.name.pl.toLowerCase().includes(lower)) ||
      (p.name && p.name.ru && p.name.ru.toLowerCase().includes(lower)) ||
      (p.name && p.name.sv && p.name.sv.toLowerCase().includes(lower))
    )
    setResults(matches.slice(0, 5))
  }, [query, pois])

  const handleResultClick = (poi: POI) => {
    if (!isValidCoordinates(poi.koordinaten)) return
    map.setView([poi.koordinaten.lat, poi.koordinaten.lng], 18)
    onSelect(poi)
    setQuery('')
    setResults([])
  }

  return (
    <div className={styles.searchContainer}>
      <input 
        type="search" 
        className={styles.searchInput}
        placeholder={dict.searchPlaceholder} 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className={styles.searchResults}>
          {results.map(poi => (
            <li key={poi.id}>
              <button className={styles.searchResultItem} onClick={() => handleResultClick(poi)}>
                {t(poi.name, locale)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function MapView({ poiIds, showSearch = false }: { poiIds?: string[], showSearch?: boolean }) {
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null)
  const [{ center, zoom }] = useState(() => getInitialMapView(!poiIds))
  const locale = useLocale()
  const { pois, loading, error, retry } = usePOIs()
  const dict = useDictionary(locale)

  const handleSelect = useCallback((poi: POI) => {
    setSelectedPOI(poi)
  }, [])

  if (loading) {
    return <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{dict.mapLoading}</div>
  }

  if (error) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div>
          <h2>{dict.loadErrorTitle}</h2>
          <p>{dict.loadErrorBody}</p>
          <button type="button" onClick={retry}>{dict.retry}</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <ClientMap center={center} zoom={zoom} className={styles.map} zoomControl={false}>
        <PersistMapView enabled={!poiIds} />
        {showSearch && <SearchOverlay pois={pois} onSelect={handleSelect} />}
        <POIMarkers pois={pois} onSelect={handleSelect} poiIds={poiIds} locale={locale} />
        <LocateButton />
      </ClientMap>
      <POICard poi={selectedPOI} onClose={() => setSelectedPOI(null)} />
    </div>
  )
}
