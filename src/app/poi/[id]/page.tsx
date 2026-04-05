import poisData from '../../../../data/pois.json'
import POIDetailClient from './POIDetailClient'

// Build-time: Generiert statische Seiten für alle bekannten POIs aus lokalem JSON
export function generateStaticParams() {
  return (poisData as any[])
    .filter((p) => p.koordinaten !== null)
    .map((poi) => ({ id: poi.id }))
}

// Server-Component die den Client-Wrapper rendert
export default async function POIDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <POIDetailClient id={id} />
}
