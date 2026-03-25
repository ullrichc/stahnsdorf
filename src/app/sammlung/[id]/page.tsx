import { getCollectionById, getAllCollections } from '@/lib/content'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SammlungContent from './SammlungContent'

export async function generateStaticParams() {
  return getAllCollections().map((collection) => ({
    id: collection.id,
  }))
}

export default async function SammlungPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = getCollectionById(id)

  if (!collection) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Collection not found</h2>
        <Link href="/sammlungen">Back to collections</Link>
      </div>
    )
  }

  return <SammlungContent collection={collection} />
}
