'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import ClientMap, { useMapInstance } from './ClientMap'
import { getAllPOIs } from '@/lib/content'
import { POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { createMarkerIcon } from './MapMarker'
import { useLocale } from '@/lib/useLocale'
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
    <button className={styles.locate} onClick={handleLocate} aria-label="Standort finden">
      {'\u{1F4CD}'}
    </button>
  )
}

function POIMarkers({ onSelect, poiIds }: { onSelect: (poi: POI) => void, poiIds?: string[] }) {
  const map = useMapInstance()
  const allPois = getAllPOIs()
  const pois = poiIds ? allPois.filter(p => poiIds.includes(p.id)) : allPois

  useEffect(() => {
    // Guard against Leaflet HMR race: if the map pane is gone, skip
    if (!map.getPane('markerPane')) return

    const markers = pois.filter(poi => poi.coordinates).map((poi) => {
      const marker = L.marker(poi.coordinates!, { icon: createMarkerIcon(poi) })
      marker.on('click', () => onSelect(poi))
      marker.addTo(map)
      return marker
    })

    const updateZoomClass = () => {
      if (map.getZoom() < 17) {
        map.getContainer().classList.add('zoom-low')
      } else {
        map.getContainer().classList.remove('zoom-low')
      }
    }
    
    updateZoomClass() // Initial state
    map.on('zoomend', updateZoomClass)

    if (poiIds && pois.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 17 });
    }

    return () => {
      map.off('zoomend', updateZoomClass)
      markers.forEach((m) => m.remove())
    }
  }, [map, pois, onSelect])

  return null
}

function SearchOverlay({ onSelect }: { onSelect: (poi: POI) => void }) {
  const map = useMapInstance()
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<POI[]>([])
  const allPois = getAllPOIs()

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const lower = query.toLowerCase()
    const matches = allPois.filter(p => 
      (p.name && p.name.de && p.name.de.toLowerCase().includes(lower)) ||
      (p.name && p.name.en && p.name.en.toLowerCase().includes(lower)) ||
      (p.name && p.name.fr && p.name.fr.toLowerCase().includes(lower)) ||
      (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lower)))
    )
    setResults(matches.slice(0, 5))
  }, [query, allPois])

  const handleResultClick = (poi: POI) => {
    map.setView(poi.coordinates!, 18)
    onSelect(poi)
    setQuery('')
    setResults([])
  }

  return (
    <div className={styles.searchContainer}>
      <input 
        type="search" 
        className={styles.searchInput}
        placeholder="Namen oder Tags suchen..." 
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

  const handleSelect = useCallback((poi: POI) => {
    setSelectedPOI(poi)
  }, [])

  return (
    <div className={styles.container}>
      <ClientMap center={CENTER} zoom={ZOOM} className={styles.map} zoomControl={false}>
        {showSearch && <SearchOverlay onSelect={handleSelect} />}
        <POIMarkers onSelect={handleSelect} poiIds={poiIds} />
        <LocateButton />
      </ClientMap>
      <POICard poi={selectedPOI} onClose={() => setSelectedPOI(null)} />
    </div>
  )
}
