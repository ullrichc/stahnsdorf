'use client'

import { useLocaleContext, SupportedLocale } from '@/lib/LocaleContext'
import { useDictionary } from '@/lib/ui-dictionary'
import styles from './page.module.css'

const localeNames: Record<SupportedLocale, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  pl: 'Polski',
  ru: 'Русский',
  sv: 'Svenska'
}

const locales: SupportedLocale[] = ['de', 'en', 'fr', 'pl', 'ru', 'sv']

export default function SettingsPage() {
  const { locale, setLocale } = useLocaleContext()
  const dict = useDictionary(locale)

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{dict.settingsTitle}</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={`material-symbols-outlined ${styles.sectionIcon}`}>translate</span>
          {dict.languageLabel}
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
