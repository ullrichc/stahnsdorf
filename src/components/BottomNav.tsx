'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from './BottomNav.module.css'

const tabs = [
  { href: '/', label: 'Karte', icon: '\u{1F4CD}' },
  { href: '/tours', label: 'Touren', icon: '\u{1F6B6}' },
  { href: '/info', label: 'Info', icon: '\u2139\uFE0F' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`${styles.tab} ${pathname === tab.href ? styles.active : ''}`}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
