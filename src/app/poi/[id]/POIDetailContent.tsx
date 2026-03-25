'use client'

import Link from 'next/link'
import { POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import AudioPlayer from '@/components/AudioPlayer'
import styles from './page.module.css'

const typeIcons: Record<string, string> = {
  grave: '\u{1FAA6}',
  building: '\u26EA',
  landmark: '\u{1F4CC}',
  nature: '\u{1F333}',
}

const typeLabels: Record<string, Record<string, string>> = {
  grave: { de: 'Grabstätte', en: 'Grave', fr: 'Tombe' },
  building: { de: 'Gebäude', en: 'Building', fr: 'Bâtiment' },
  landmark: { de: 'Orientierungspunkt', en: 'Landmark', fr: 'Point de repère' },
  nature: { de: 'Natur', en: 'Nature', fr: 'Nature' },
}

export default function POIDetailContent({ poi }: { poi: POI }) {
  const locale = useLocale()

  const audioSrc = (poi.audio && poi.audio.length > 0) ? poi.audio[0] : undefined
  const label = typeLabels[poi.type]?.[locale] || typeLabels[poi.type]?.de || poi.type

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/" className={styles.back}>{'\u2190'}</Link>
        <span>{typeIcons[poi.type] || '\u{1F4CC}'}</span>
      </div>
      <div className={styles.content}>
        <span className={styles.badge}>{label}</span>
        <h1 className={styles.name}>{t(poi.name, locale)}</h1>
        {poi.dates && (
          <p className={styles.dates}>
            {poi.dates.born && `* ${poi.dates.born}`}
            {poi.dates.born && poi.dates.died && ' \u2013 '}
            {poi.dates.died && `\u2020 ${poi.dates.died}`}
          </p>
        )}
        <p className={styles.description}>{t(poi.description, locale)}</p>
        <AudioPlayer src={audioSrc} />
        {poi.tags && poi.tags.length > 0 && (
          <div className={styles.tags}>
            {poi.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
