'use client'

import Link from 'next/link'
import { usePOI } from '@/lib/useFirestore'
import POIDetailContent from './POIDetailContent'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'

export default function POIDetailClient({ id }: { id: string }) {
  const { poi, loading, error, notFound, retry } = usePOI(id)
  const locale = useLocale()
  const dict = useDictionary(locale)

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        {dict.loadingEntry}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>{dict.loadErrorTitle}</h2>
        <p>{dict.loadErrorBody}</p>
        <button type="button" onClick={retry}>{dict.retry}</button>
      </div>
    )
  }

  if (!poi || notFound) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>{dict.notFoundTitle}</h2>
        <p>{dict.poiNotFound}</p>
        <Link href="/">{dict.backToMap}</Link>
      </div>
    )
  }

  return <POIDetailContent poi={poi} />
}
