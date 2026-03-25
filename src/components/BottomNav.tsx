'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useLocaleContext, SupportedLocale } from '@/lib/LocaleContext'
import styles from './BottomNav.module.css'

const tabLabels: Record<string, Record<SupportedLocale, string>> = {
  '/': { de: 'Karte', en: 'Map', fr: 'Carte' },
  '/sammlungen': { de: 'Sammlungen', en: 'Collections', fr: 'Collections' },
  '/info': { de: 'Info', en: 'Info', fr: 'Info' },
}

const tabs = [
  { href: '/', icon: '📍' },
  { href: '/sammlungen', icon: '🗂️' },
  { href: '/info', icon: 'ℹ️' },
]

const locales: SupportedLocale[] = ['de', 'en', 'fr']

export default function BottomNav() {
  const pathname = usePathname()
  const { locale, setLocale } = useLocaleContext()

  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`${styles.tab} ${pathname === tab.href ? styles.active : ''}`}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tabLabels[tab.href][locale]}</span>
        </Link>
      ))}
      <div className={styles.langSwitcher}>
        {locales.map((l, i) => (
          <span key={l}>
            <button
              className={`${styles.langBtn} ${l === locale ? styles.langActive : ''}`}
              onClick={() => setLocale(l)}
              aria-label={`Switch language to ${l.toUpperCase()}`}
            >
              {l.toUpperCase()}
            </button>
            {i < locales.length - 1 && <span className={styles.langSep}>·</span>}
          </span>
        ))}
      </div>
    </nav>
  )
}
