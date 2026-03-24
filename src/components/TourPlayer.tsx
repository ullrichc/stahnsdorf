'use client'
import { useState, useEffect } from 'react'
import { TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import ClientMap from './ClientMap'
import L from 'leaflet'
import Link from 'next/link'
import { Tour } from '@/lib/types'
import { getPOIById } from '@/lib/content'
import { t } from '@/lib/i18n'
import { distanceMeters, formatDistance } from '@/lib/geo'
import styles from './TourPlayer.module.css'

type Props = {
  tour: Tour
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1])))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [map, positions])
  return null
}

function createNumberIcon(n: number, active: boolean): L.DivIcon {
  return L.divIcon({
    html: `<span style="
      display:inline-flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:50%;
      background:${active ? '#5a7247' : '#8b7355'};
      color:white;font-size:0.85rem;font-weight:600;
      border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);
    ">${n}</span>`,
    className: 'tour-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  })
}

export default function TourPlayer({ tour }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  const stops = tour.stops.map((stop) => ({
    ...stop,
    poi: getPOIById(stop.poiId),
  }))

  const positions: [number, number][] = stops
    .filter((s) => s.poi)
    .map((s) => s.poi!.coordinates)

  const currentStop = stops[currentIndex]
  const currentPOI = currentStop?.poi
  const nextStop = stops[currentIndex + 1]

  const distToStop =
    userPos && currentPOI
      ? formatDistance(distanceMeters(userPos, currentPOI.coordinates))
      : null

  return (
    <div className={styles.container}>
      <div className={styles.mapArea}>
        <ClientMap
          center={positions[0] || [52.3915, 13.2050]}
          zoom={16}
          className={styles.map}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={positions} color="#5a7247" weight={3} opacity={0.7} />
          {stops.map((stop, i) =>
            stop.poi ? (
              <Marker
                key={stop.poiId}
                position={stop.poi.coordinates}
                icon={createNumberIcon(stop.order, i === currentIndex)}
              />
            ) : null
          )}
          {userPos && (
            <Marker
              position={userPos}
              icon={L.divIcon({
                html: '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#4285f4;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></span>',
                className: 'user-marker',
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              })}
            />
          )}
          <FitBounds positions={positions} />
        </ClientMap>
      </div>
      <div className={styles.panel}>
        <div className={styles.progress}>
          Halt {currentIndex + 1} von {stops.length}
        </div>
        {currentPOI && (
          <>
            <h2 className={styles.stopName}>{t(currentPOI.name)}</h2>
            {distToStop && (
              <p className={styles.distance}>{distToStop} entfernt</p>
            )}
          </>
        )}
        {nextStop && (
          <p className={styles.transition}>{t(currentStop.transition)}</p>
        )}
        {!nextStop && currentIndex === stops.length - 1 && (
          <p className={styles.transition}>Sie haben das Ende der Tour erreicht!</p>
        )}
        <div className={styles.controls}>
          <button
            className={styles.btn}
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => i - 1)}
          >
            {'\u2190'} Zurück
          </button>
          {currentPOI && (
            <Link href={`/poi/${currentPOI.id}`} className={styles.detailLink}>
              Details
            </Link>
          )}
          <button
            className={styles.btn}
            disabled={currentIndex === stops.length - 1}
            onClick={() => setCurrentIndex((i) => i + 1)}
          >
            Weiter {'\u2192'}
          </button>
        </div>
      </div>
    </div>
  )
}
