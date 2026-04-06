'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const SUPPORTED_LOCALES = ['de', 'en', 'fr', 'pl', 'ru', 'sv'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
const DEFAULT_LOCALE: SupportedLocale = 'de'
const STORAGE_KEY = 'locale'

type LocaleContextType = {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
}

const LocaleContext = createContext<LocaleContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
})

function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const browserLang = navigator.language.split('-')[0]
  return (SUPPORTED_LOCALES as readonly string[]).includes(browserLang)
    ? (browserLang as SupportedLocale)
    : DEFAULT_LOCALE
}

function getInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
    return stored as SupportedLocale
  }
  return detectBrowserLocale()
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLocaleState(getInitialLocale())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale
      localStorage.setItem(STORAGE_KEY, locale)
    }
  }, [locale, mounted])

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): SupportedLocale {
  return useContext(LocaleContext).locale
}

export function useLocaleContext() {
  return useContext(LocaleContext)
}
