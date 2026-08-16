'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'
import SammlungDetailClient from './[id]/SammlungDetailClient'

export default function CollectionQueryPageClient() {
  const id = useSearchParams().get('id')
  const locale = useLocale()
  const dict = useDictionary(locale)

  if (!id) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>{dict.notFoundTitle}</h2>
        <p>{dict.collectionNotFound}</p>
        <Link href="/sammlungen">{dict.backToCollections}</Link>
      </div>
    )
  }

  return <SammlungDetailClient id={id} />
}
