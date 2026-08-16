'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import POIForm from '@/components/admin/POIForm'

export default function EditPOIQueryClient() {
  const id = useSearchParams().get('id')

  if (!id) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>POI nicht gefunden</h2>
        <p>In diesem Link fehlt die POI-ID.</p>
        <Link href="/admin">Zurück zur Übersicht</Link>
      </div>
    )
  }

  return <POIForm poiId={id} />
}
