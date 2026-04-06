import backupData from '../../../../data/stahnsdorf-backup-translated.json'
import SammlungDetailClient from './SammlungDetailClient'

// Build-time: Generiert statische Seiten aus dem Unified Snapshot
export function generateStaticParams() {
  return (backupData.collections as any[]).map((col) => ({ id: col.id }))
}

export default async function SammlungPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SammlungDetailClient id={id} />
}
