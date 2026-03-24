'use client'
import { useState, useRef, useCallback } from 'react'
import { TileLayer, Marker, useMap } from 'react-leaflet'
import ClientMap from './ClientMap'
import L from 'leaflet'
import { getAllPOIs } from '@/lib/content'
import { POI } from '@/lib/types'
import { createMarkerIcon } from './MapMarker'
import POICard from './POICard'
import styles from './MapView.module.css'

const CENTER: [number, number] = [52.3915, 13.2050]
const ZOOM = 16

function LocateButton() {
  const map = useMap()
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

export default function MapView() {
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null)
  const pois = getAllPOIs()

  return (
    <div className={styles.container}>
      <ClientMap
        center={CENTER}
        zoom={ZOOM}
        className={styles.map}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pois.map((poi) => (
          <Marker
            key={poi.id}
            position={poi.coordinates}
            icon={createMarkerIcon(poi.type)}
            eventHandlers={{
              click: () => setSelectedPOI(poi),
            }}
          />
        ))}
        <LocateButton />
      </ClientMap>
      <POICard poi={selectedPOI} onClose={() => setSelectedPOI(null)} />
    </div>
  )
}
