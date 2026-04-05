'use client'

import { useCollections } from '@/lib/useFirestore'
import CollectionList from '@/components/CollectionList'

export default function SammlungenPage() {
  const { collections, loading } = useCollections()

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Sammlungen laden…</div>
  }

  return <CollectionList collections={collections} />
}
