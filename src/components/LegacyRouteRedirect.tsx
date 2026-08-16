'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'

export default function LegacyRouteRedirect({ href }: { href: string }) {
  const router = useRouter()
  const locale = useLocale()
  const dict = useDictionary(locale)

  useEffect(() => {
    router.replace(href)
  }, [href, router])

  return (
    <div style={{ padding: '24px' }} role="status" aria-live="polite">
      {dict.redirecting}
    </div>
  )
}
