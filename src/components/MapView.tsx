'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import L from 'leaflet'
import ClientMap, { useMapInstance } from './ClientMap'
import { usePOIs } from '@/lib/useFirestore'
import { Koordinaten, POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { createMarkerIcon } from './MapMarker'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'
import { resolveInitialMapView, writeStoredMapView } from '@/lib/map-view-state'
import POICard from './POICard'
import styles from './MapView.module.css'
import { isValidCoordinates } from '@/lib/geo'
import AppIcon from './AppIcon'
import MapOverlay from './MapOverlay'
import { isInsideCemetery } from '@/lib/map-overlay'

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

function LocateButton({ autoStart = false }: { autoStart?: boolean }) {
  const map = useMapInstance()
  const markerRef = useRef<L.CircleMarker | null>(null)
  const accuracyRef = useRef<L.Circle | null>(null)
  const firstFixRef = useRef(true)
  const automaticFixRef = useRef(false)
  const showErrorRef = useRef(true)
  const autoStartedRef = useRef(false)
  const [tracking, setTracking] = useState(false)
  const [error, setError] = useState(false)
  const locale = useLocale()
  const dict = useDictionary(locale)

  const startLocating = useCallback((automatic: boolean) => {
    firstFixRef.current = true
    automaticFixRef.current = automatic
    showErrorRef.current = !automatic
    setError(false)
    setTracking(true)
    map.locate({
      watch: true,
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 30000,
    })
  }, [map])

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
        const insideCemetery = isInsideCemetery(event.latlng)
        if (!automaticFixRef.current || insideCemetery) {
          map.setView(event.latlng, Math.max(map.getZoom(), 19))
        } else {
          map.stopLocate()
          setTracking(false)
          markerRef.current.remove()
          accuracyRef.current.remove()
          markerRef.current = null
          accuracyRef.current = null
        }
        firstFixRef.current = false
      }
    }

    const handleError = () => {
      map.stopLocate()
      setTracking(false)
      setError(showErrorRef.current)
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

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return
    autoStartedRef.current = true
    startLocating(true)
  }, [autoStart, startLocating])

  const handleLocate = useCallback(() => {
    if (tracking) {
      map.stopLocate()
      setTracking(false)
      return
    }

    startLocating(false)
  }, [map, startLocating, tracking])

  return (
    <div className={styles.locateWrap}>
      {error && <div className={styles.locateError} role="status">{dict.locationError}</div>}
      <button
        className={styles.locate}
        onClick={handleLocate}
        aria-label={dict.locate}
        aria-pressed={tracking}
        data-testid="locate-button"
      >
        <AppIcon name="my_location" />
      </button>
    </div>
  )
}

function POIMarkers({
  pois,
  onSelect,
  poiIds,
  locale,
  selectedPoiId,
  focusPoiId,
}: {
  pois: POI[]
  onSelect: (poi: POI) => void
  poiIds?: string[]
  locale: string
  selectedPoiId?: string
  focusPoiId?: string
}) {
  const map = useMapInstance()
  const focusedOnceRef = useRef<string | null>(null)
  const fittedPoiIdsRef = useRef<string | null>(null)
  const filtered = useMemo(
    () => poiIds ? pois.filter((poi) => poiIds.includes(poi.id)) : pois,
    [poiIds, pois],
  )

  useEffect(() => {
    // Guard against Leaflet HMR race: if the map pane is gone, skip
    if (!map.getPane('markerPane')) return

    const validPOIs = filtered.filter(
      (poi): poi is POI & { koordinaten: Koordinaten } => isValidCoordinates(poi.koordinaten),
    )
    const entries = validPOIs.map((poi) => {
      const coords: [number, number] = [poi.koordinaten.lat, poi.koordinaten.lng]
      const selected = selectedPoiId === poi.id
      const marker = L.marker(coords, {
        icon: createMarkerIcon(poi, { compact: map.getZoom() <= 16 && !selected, selected }),
        zIndexOffset: selected ? 1000 : 0,
      })
      const select = () => {
        map.panInside(coords, {
          paddingTopLeft: [24, 80],
          paddingBottomRight: [24, 300],
        })
        onSelect(poi)
      }
      marker.on('click', select)
      marker.bindTooltip(t(poi.name, locale), {
        permanent: true,
        interactive: true,
        direction: 'right',
        offset: [18, 0],
        className: 'poi-tooltip',
      })
      marker.getTooltip()?.on('click', select)
      marker.addTo(map)
      return { marker, poi }
    })

    let showFullMarkers = map.getZoom() >= 17
    let showAllTooltips = map.getZoom() >= 19

    const setTooltipOpacity = (m: L.Marker, visible: boolean) => {
      const el = m.getTooltip()?.getElement()
      if (el) {
        el.style.opacity = visible ? '1' : '0'
        el.style.pointerEvents = visible ? 'auto' : 'none'
      }
    }

    const updateTooltipVisibility = () => {
      showFullMarkers = map.getZoom() >= 17
      showAllTooltips = map.getZoom() >= 19
      entries.forEach(({ marker, poi }) => {
        const selected = selectedPoiId === poi.id
        marker.setIcon(createMarkerIcon(poi, {
          compact: !showFullMarkers && !selected,
          selected,
        }))
        marker.setZIndexOffset(selected ? 1000 : 0)
        setTooltipOpacity(marker, showAllTooltips || selected)
      })
    }

    // Show tooltip on hover/touch when zoomed out
    entries.forEach(({ marker, poi }) => {
      marker.on('mouseover', () => { if (!showAllTooltips) setTooltipOpacity(marker, true) })
      marker.on('mouseout',  () => {
        if (!showAllTooltips && selectedPoiId !== poi.id) setTooltipOpacity(marker, false)
      })
    })
    
    updateTooltipVisibility() // Initial state
    map.on('zoomend', updateTooltipVisibility)

    const focused = entries.find(({ poi }) => poi.id === focusPoiId)
    if (focused && focusedOnceRef.current !== focusPoiId) {
      focusedOnceRef.current = focusPoiId ?? null
      map.setView(focused.marker.getLatLng(), Math.max(map.getZoom(), 18), { animate: false })
      onSelect(focused.poi)
      updateTooltipVisibility()
    } else if (poiIds && entries.length > 0 && fittedPoiIdsRef.current !== poiIds.join('|')) {
      fittedPoiIdsRef.current = poiIds.join('|')
      const group = L.featureGroup(entries.map(({ marker }) => marker));
      map.fitBounds(group.getBounds(), { padding: [32, 32], maxZoom: 18 });
    }

    return () => {
      map.off('zoomend', updateTooltipVisibility)
      entries.forEach(({ marker }) => marker.remove())
    }
  }, [map, filtered, onSelect, locale, poiIds, selectedPoiId, focusPoiId])

  return null
}

function SearchOverlay({
  pois,
  onSelect,
  activePoiId,
}: {
  pois: POI[]
  onSelect: (poi: POI) => void
  activePoiId?: string
}) {
  const map = useMapInstance()
  const locale = useLocale()
  const dict = useDictionary(locale)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<POI[]>([])
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (activePoiId) {
      setOpen(false)
      setQuery('')
      setResults([])
    }
  }, [activePoiId])

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
    setOpen(false)
  }

  return (
    <div className={styles.searchContainer}>
      <button
        type="button"
        className={styles.searchToggle}
        aria-label={dict.searchPlaceholder}
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value)
          if (open) {
            setQuery('')
            setResults([])
          }
        }}
      >
        <AppIcon name={open ? 'close' : 'search'} />
      </button>
      {open && (
        <div className={styles.searchPanel} data-testid="search-panel">
          <input
            ref={inputRef}
            type="search"
            className={styles.searchInput}
            placeholder={dict.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setOpen(false)
            }}
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
      )}
    </div>
  )
}

export default function MapView({
  poiIds,
  showSearch = false,
  focusPoiId,
}: {
  poiIds?: string[]
  showSearch?: boolean
  focusPoiId?: string
}) {
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null)
  const [initialView] = useState(() => resolveInitialMapView(
    !poiIds && typeof window !== 'undefined' ? window.sessionStorage : null,
  ))
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
    <div className={`${styles.container} ${selectedPOI ? styles.hasSelection : ''}`}>
      <ClientMap
        center={[initialView.lat, initialView.lng]}
        zoom={initialView.zoom}
        className={styles.map}
        zoomControl={false}
      >
        <MapOverlay />
        <PersistMapView enabled={!poiIds} />
        {showSearch && (
          <SearchOverlay pois={pois} onSelect={handleSelect} activePoiId={selectedPOI?.id} />
        )}
        <POIMarkers
          pois={pois}
          onSelect={handleSelect}
          poiIds={poiIds}
          locale={locale}
          selectedPoiId={selectedPOI?.id}
          focusPoiId={focusPoiId}
        />
        <LocateButton autoStart={!poiIds && !initialView.restored} />
      </ClientMap>
      <POICard poi={selectedPOI} onClose={() => setSelectedPOI(null)} />
    </div>
  )
}
