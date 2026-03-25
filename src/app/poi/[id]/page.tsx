import Link from 'next/link'
import { getAllPOIs, getPOIById } from '@/lib/content'
import POIDetailContent from './POIDetailContent'

export function generateStaticParams() {
  return getAllPOIs().map((poi) => ({ id: poi.id }))
}

export default async function POIDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poi = getPOIById(id)

  if (!poi) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Not found</h2>
        <p>This point of interest was not found.</p>
        <Link href="/">Back to map</Link>
      </div>
    )
  }

  return <POIDetailContent poi={poi} />
}
