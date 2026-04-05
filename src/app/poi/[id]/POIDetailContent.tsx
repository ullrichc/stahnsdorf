'use client'

import Link from 'next/link'
import { POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import AudioPlayer from '@/components/AudioPlayer'
import styles from './page.module.css'

const typeIcons: Record<string, string> = {
  grab: '\u{1FAA6}',
  bauwerk: '\u26EA',
  bereich: '\u{1F4CC}',
  denkmal: '\u{1F3DB}',
  mausoleum: '\u{1F3DB}',
  gedenkanlage: '\u{1F56F}',
}

const typeLabels: Record<string, Record<string, string>> = {
  grab: { de: 'Grabstätte', en: 'Grave', fr: 'Tombe' },
  bauwerk: { de: 'Bauwerk', en: 'Building', fr: 'Bâtiment' },
  bereich: { de: 'Bereich', en: 'Section', fr: 'Section' },
  denkmal: { de: 'Denkmal', en: 'Memorial', fr: 'Mémorial' },
  mausoleum: { de: 'Mausoleum', en: 'Mausoleum', fr: 'Mausolée' },
  gedenkanlage: { de: 'Gedenkanlage', en: 'Memorial site', fr: 'Lieu de mémoire' },
}

export default function POIDetailContent({ poi }: { poi: POI }) {
  const locale = useLocale()

  const audioSrc = (poi.audio && typeof poi.audio === 'object') ? poi.audio[locale] || poi.audio['de'] : undefined
  const label = typeLabels[poi.typ]?.[locale] || typeLabels[poi.typ]?.de || poi.typ

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/" className={styles.back}>{'\u2190'}</Link>
        <span>{typeIcons[poi.typ] || '\u{1F4CC}'}</span>
      </div>
      <div className={styles.content}>
        <span className={styles.badge}>{label}</span>
        <h1 className={styles.name}>{t(poi.name, locale)}</h1>
        {(poi.datum_von || poi.datum_bis) && (
          <p className={styles.dates}>
            {poi.datum_von && `* ${poi.datum_von}`}
            {poi.datum_von && poi.datum_bis && ' \u2013 '}
            {poi.datum_bis && `\u2020 ${poi.datum_bis}`}
          </p>
        )}
        <p className={styles.description}>{t(poi.beschreibung, locale)}</p>
        <AudioPlayer src={audioSrc} />
      </div>
    </div>
  )
}
