'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DynamicMapView from '@/components/DynamicMapView'
import { normalizeInternalRedirect } from '@/lib/redirect'

function MapPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const redirect = normalizeInternalRedirect(searchParams.get('redirect'))
    if (redirect) {
      router.replace(redirect)
    }
  }, [router, searchParams])

  return <DynamicMapView showSearch={true} focusPoiId={searchParams.get('poi') ?? undefined} />
}

export default function MapPage() {
  return (
    <>
      <Suspense fallback={null}>
        <MapPageContent />
      </Suspense>
    </>
  )
}
