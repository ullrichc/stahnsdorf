'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from './BottomNav.module.css'

const tabs = [
  { href: '/', label: 'Karte', icon: '📍' },
  { href: '/sammlungen', label: 'Sammlungen', icon: '🗂️' },
  { href: '/info', label: 'Info', icon: 'ℹ️' },
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
