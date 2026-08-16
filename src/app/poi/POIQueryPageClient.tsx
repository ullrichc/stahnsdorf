'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'
import POIDetailClient from './[id]/POIDetailClient'

export default function POIQueryPageClient() {
  const id = useSearchParams().get('id')
  const locale = useLocale()
  const dict = useDictionary(locale)

  if (!id) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>{dict.notFoundTitle}</h2>
        <p>{dict.poiNotFound}</p>
        <Link href="/">{dict.backToMap}</Link>
      </div>
    )
  }

  return <POIDetailClient id={id} />
}
