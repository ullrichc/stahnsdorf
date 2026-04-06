'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useLocaleContext, SupportedLocale } from '@/lib/LocaleContext'
import styles from './BottomNav.module.css'

const tabs = [
  { href: '/', icon: 'map', labels: { de: 'Karte', en: 'Map', fr: 'Carte' } },
  { href: '/sammlungen', icon: 'library_books', labels: { de: 'Sammlungen', en: 'Collections', fr: 'Collections' } },
  { href: '/info', icon: 'info', labels: { de: 'Info', en: 'Info', fr: 'Info' } },
  { href: '/einstellungen', icon: 'settings', labels: { de: 'Optionen', en: 'Settings', fr: 'Options' } },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { locale } = useLocaleContext()

  // Don't show bottom nav on admin pages
  if (pathname?.startsWith('/admin')) return null

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`${styles.tab} ${isActive(tab.href) ? styles.active : ''}`}
        >
          <span className={`material-symbols-outlined ${styles.icon} ${isActive(tab.href) ? 'material-symbols-filled' : ''}`}>
            {tab.icon}
          </span>
          <span className={styles.label}>{tab.labels[locale] || tab.labels.de}</span>
        </Link>
      ))}
    </nav>
  )
}
