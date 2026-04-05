'use client'

import Link from 'next/link'
import { usePOI } from '@/lib/useFirestore'
import POIDetailContent from './POIDetailContent'

export default function POIDetailClient({ id }: { id: string }) {
  const { poi, loading, error } = usePOI(id)

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Laden…
      </div>
    )
  }

  if (!poi || error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Nicht gefunden</h2>
        <p>Dieser Eintrag wurde nicht gefunden.</p>
        <Link href="/">← Zurück zur Karte</Link>
      </div>
    )
  }

  return <POIDetailContent poi={poi} />
}
