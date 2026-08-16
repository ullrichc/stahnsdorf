import { Suspense } from 'react'
import POIQueryPageClient from './POIQueryPageClient'

export default function POIPage() {
  return (
    <Suspense fallback={null}>
      <POIQueryPageClient />
    </Suspense>
  )
}
