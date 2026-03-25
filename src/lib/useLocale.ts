'use client'
import { useState, useEffect } from 'react'

const DEFAULT_LOCALE = 'de'

export function useLocale() {
  const [locale, setLocale] = useState(DEFAULT_LOCALE)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0]
      if (['de', 'en', 'fr'].includes(browserLang)) {
        setLocale(browserLang)
      }
    }
  }, [])

  return locale
}
