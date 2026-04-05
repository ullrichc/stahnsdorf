import collectionsData from '../../../../data/collections.json'
import SammlungDetailClient from './SammlungDetailClient'

export function generateStaticParams() {
  return (collectionsData as any[]).map((col) => ({ id: col.id }))
}

export default async function SammlungPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SammlungDetailClient id={id} />
}
