'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useLocaleContext } from '@/lib/LocaleContext'
import { useDictionary, UIDictionary } from '@/lib/ui-dictionary'
import styles from './BottomNav.module.css'

const tabs = [
  { href: '/', icon: 'map', getLabel: (d: UIDictionary) => d.navMap },
  { href: '/sammlungen', icon: 'library_books', getLabel: (d: UIDictionary) => d.navCollections },
  { href: '/info', icon: 'info', getLabel: (d: UIDictionary) => d.navInfo },
  { href: '/einstellungen', icon: 'settings', getLabel: (d: UIDictionary) => d.navSettings },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { locale } = useLocaleContext()
  const dict = useDictionary(locale)

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
          <span className={styles.label}>{tab.getLabel(dict)}</span>
        </Link>
      ))}
    </nav>
  )
}
