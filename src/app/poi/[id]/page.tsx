import backupData from '../../../../data/stahnsdorf-backup-translated.json'
import LegacyRouteRedirect from '@/components/LegacyRouteRedirect'
import { poiDetailHref } from '@/lib/redirect'

// Build-time: Generiert statische Seiten für alle bekannten POIs aus lokalem JSON Snapshot
export function generateStaticParams() {
  return (backupData.pois as any[])
    .filter((p) => p.koordinaten !== null)
    .map((poi) => ({ id: poi.id }))
}

// Server-Component die den Client-Wrapper rendert
export default async function POIDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LegacyRouteRedirect href={poiDetailHref(id)} />
}
