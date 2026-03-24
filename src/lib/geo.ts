/** Haversine distance between two [lat, lng] points in meters */
export function distanceMeters(
  a: [number, number],
  b: [number, number]
): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Format distance for display: "120 m" or "1,2 km" */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}
