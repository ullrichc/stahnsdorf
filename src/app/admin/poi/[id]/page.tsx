import backupData from '../../../../../data/stahnsdorf-backup-translated.json'
import LegacyRouteRedirect from '@/components/LegacyRouteRedirect'
import { adminPoiEditHref } from '@/lib/redirect'

export function generateStaticParams() {
  return (backupData.pois as any[]).map((poi) => ({ id: poi.id }))
}

export default async function EditPOIPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LegacyRouteRedirect href={adminPoiEditHref(id)} />
}
