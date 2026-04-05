'use client'

import Link from 'next/link'
import { useCollection } from '@/lib/useFirestore'
import SammlungContent from './SammlungContent'

export default function SammlungDetailClient({ id }: { id: string }) {
  const { collection, loading, error } = useCollection(id)

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Laden…</div>
  }

  if (!collection || error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Nicht gefunden</h2>
        <p>Diese Sammlung wurde nicht gefunden.</p>
        <Link href="/sammlungen">← Zurück zu Sammlungen</Link>
      </div>
    )
  }

  return <SammlungContent collection={collection} />
}
