'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import ClientMap, { useMapInstance } from './ClientMap'
import { usePOIs } from '@/lib/useFirestore'
import { POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { createMarkerIcon } from './MapMarker'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'
import POICard from './POICard'
import styles from './MapView.module.css'

const CENTER: [number, number] = [52.389506, 13.180954]
const ZOOM = 16

function LocateButton() {
  const map = useMapInstance()
  const markerRef = useRef<L.CircleMarker | null>(null)

  const handleLocate = useCallback(() => {
    map.locate({ setView: true, maxZoom: 17 })
    map.once('locationfound', (e) => {
      if (markerRef.current) {
        markerRef.current.remove()
      }
      markerRef.current = L.circleMarker(e.latlng, {
        radius: 8,
        fillColor: '#4285f4',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2,
      }).addTo(map)
    })
  }, [map])

  return (
    <button className={styles.locate} onClick={handleLocate} aria-label="Locate">
      <span className="material-symbols-outlined">my_location</span>
    </button>
  )
}

function POIMarkers({ pois, onSelect, poiIds, locale }: { pois: POI[], onSelect: (poi: POI) => void, poiIds?: string[], locale: string }) {
  const map = useMapInstance()
  const filtered = poiIds ? pois.filter(p => poiIds.includes(p.id)) : pois

  useEffect(() => {
    // Guard against Leaflet HMR race: if the map pane is gone, skip
    if (!map.getPane('markerPane')) return

    const markers = filtered.filter(poi => poi.koordinaten).map((poi) => {
      const coords: [number, number] = [poi.koordinaten!.lat, poi.koordinaten!.lng]
      const marker = L.marker(coords, { icon: createMarkerIcon(poi) })
      marker.on('click', () => onSelect(poi))
      marker.bindTooltip(t(poi.name, locale), {
        permanent: true,
        direction: 'right',
        offset: [18, 0],
        className: 'poi-tooltip',
      })
      marker.addTo(map)
      return marker
    })

    let isZoomedIn = map.getZoom() >= 17

    const setTooltipOpacity = (m: L.Marker, visible: boolean) => {
      const el = m.getTooltip()?.getElement()
      if (el) el.style.opacity = visible ? '1' : '0'
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
    map.setView([poi.koordinaten!.lat, poi.koordinaten!.lng], 18)
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
  const locale = useLocale()
  const { pois, loading } = usePOIs()

  const handleSelect = useCallback((poi: POI) => {
    setSelectedPOI(poi)
  }, [])

  if (loading) {
    return <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Karte wird geladen…</div>
  }

  return (
    <div className={styles.container}>
      <ClientMap center={CENTER} zoom={ZOOM} className={styles.map} zoomControl={false}>
        {showSearch && <SearchOverlay pois={pois} onSelect={handleSelect} />}
        <POIMarkers pois={pois} onSelect={handleSelect} poiIds={poiIds} locale={locale} />
        <LocateButton />
      </ClientMap>
      <POICard poi={selectedPOI} onClose={() => setSelectedPOI(null)} />
    </div>
  )
}
