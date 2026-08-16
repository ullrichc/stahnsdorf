import { useState, useEffect } from 'react'

export function useGeolocation() {
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [error, setError] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError(0)
      return
    }

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setError(null)
      },
      (err) => setError(err.code),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 30000 }
    )

    return () => navigator.geolocation.clearWatch(watcher)
  }, [])

  return { location, error }
}
