'use client'

import Link from 'next/link'
import { useCollection } from '@/lib/useFirestore'
import SammlungContent from './SammlungContent'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'

export default function SammlungDetailClient({ id }: { id: string }) {
  const { collection, loading, error, notFound, retry } = useCollection(id)
  const locale = useLocale()
  const dict = useDictionary(locale)

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>{dict.loadingCollection}</div>
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

  if (!collection || notFound) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>{dict.notFoundTitle}</h2>
        <p>{dict.collectionNotFound}</p>
        <Link href="/sammlungen">{dict.backToCollections}</Link>
      </div>
    )
  }

  return <SammlungContent collection={collection} />
}
