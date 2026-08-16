'use client'

import { useCollections } from '@/lib/useFirestore'
import CollectionList from '@/components/CollectionList'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'

export default function SammlungenPage() {
  const { collections, loading, error, retry } = useCollections()
  const locale = useLocale()
  const dict = useDictionary(locale)

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>{dict.loadingCollections}</div>
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

  return <CollectionList collections={collections} />
}
