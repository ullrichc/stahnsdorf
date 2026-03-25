'use client'
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import L from 'leaflet'

type ClientMapProps = {
  center: [number, number]
  zoom: number
  className?: string
  zoomControl?: boolean
  children?: ReactNode
}

const MapInstanceContext = createContext<L.Map | null>(null)

export function useMapInstance(): L.Map {
  const map = useContext(MapInstanceContext)
  if (!map) throw new Error('useMapInstance must be used inside ClientMap')
  return map
}

export default function ClientMap({ center, zoom, className, zoomControl = true, children }: ClientMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const mapDiv = document.createElement('div')
    mapDiv.style.width = '100%'
    mapDiv.style.height = '100%'
    el.appendChild(mapDiv)

    const instance = L.map(mapDiv, {
      center,
      zoom,
      zoomControl: false, // We manually add it below to control position safely
      maxZoom: 22,
    })

    if (zoomControl) {
      L.control.zoom({ position: 'bottomright' }).addTo(instance)
    }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxNativeZoom: 19,
      maxZoom: 22,
    }).addTo(instance)

    // Handle Next.js soft navigations causing 0x0 size mounts
    const observer = new ResizeObserver(() => {
      instance.invalidateSize()
    })
    observer.observe(mapDiv)
    
    // Fallback trigger after paint
    const timeoutId = setTimeout(() => instance.invalidateSize(), 150)

    setMap(instance)

    return () => {
      observer.disconnect()
      clearTimeout(timeoutId)
      instance.remove()
      setMap(null)
      if (el.contains(mapDiv)) el.removeChild(mapDiv)
    }
  }, [center, zoom, zoomControl])

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }}>
      {map && (
        <MapInstanceContext.Provider value={map}>
          {children}
        </MapInstanceContext.Provider>
      )}
    </div>
  )
}
