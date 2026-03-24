'use client'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, MapContainerProps } from 'react-leaflet'

/**
 * Wrapper around MapContainer that handles React strict mode double-mounting.
 * Leaflet throws "Map container is already initialized" when React unmounts
 * and remounts the component (strict mode in dev). This wrapper uses a key
 * that changes on remount, forcing a fresh DOM element.
 */
export default function ClientMap(props: MapContainerProps) {
  const [mapKey, setMapKey] = useState(0)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (mountedRef.current) {
      // Component was remounted (strict mode) — bump key to force fresh DOM
      setMapKey((k) => k + 1)
    }
    mountedRef.current = true
  }, [])

  return <MapContainer key={mapKey} {...props} />
}
