import { Suspense } from 'react'
import CollectionQueryPageClient from './CollectionQueryPageClient'

export default function CollectionPage() {
  return (
    <Suspense fallback={null}>
      <CollectionQueryPageClient />
    </Suspense>
  )
}
