'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { getAppBasePath } from '@/lib/app-path'
import { normalizeInternalRedirect } from '@/lib/redirect'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'

export default function NotFound() {
  const locale = useLocale()
  const dict = useDictionary(locale)

  useEffect(() => {
    const basePath = getAppBasePath()
    const pathname = window.location.pathname
    const relativePath = basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || '/'
      : pathname
    const requested = `${relativePath}${window.location.search}${window.location.hash}`
    const canonical = normalizeInternalRedirect(requested)

    if (canonical && canonical !== requested) {
      window.location.replace(`${basePath}${canonical}`)
    }
  }, [])

  return (
    <div style={{ padding: '24px' }} data-legacy-route-fallback>
      <h1>{dict.notFoundTitle}</h1>
      <p>{dict.pageNotFoundBody}</p>
      <Link href="/">{dict.backToMap}</Link>
    </div>
  )
}
