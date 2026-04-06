'use client'

import { useLocaleContext, SupportedLocale } from '@/lib/LocaleContext'
import styles from './page.module.css'

const localeNames: Record<SupportedLocale, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
}

const locales: SupportedLocale[] = ['de', 'en', 'fr']

export default function SettingsPage() {
  const { locale, setLocale } = useLocaleContext()

  const title = locale === 'en' ? 'Settings' : locale === 'fr' ? 'Options' : 'Optionen'
  const langLabel = locale === 'en' ? 'Language' : locale === 'fr' ? 'Langue' : 'Sprache'

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{title}</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={`material-symbols-outlined ${styles.sectionIcon}`}>translate</span>
          {langLabel}
        </h2>
        <div className={styles.langGrid}>
          {locales.map((l) => (
            <button
              key={l}
              className={`${styles.langBtn} ${l === locale ? styles.langActive : ''}`}
              onClick={() => setLocale(l)}
            >
              <span className={styles.langCode}>{l.toUpperCase()}</span>
              <span className={styles.langName}>{localeNames[l]}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
