'use client'

import Link from 'next/link'
import { POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import AudioPlayer from '@/components/AudioPlayer'
import styles from './page.module.css'

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
      {/* Header with back button */}
      <div className={styles.header}>
        <Link href="/" className={styles.back}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
      </div>

      <div className={styles.content}>
        {/* Type badge */}
        <span className={styles.badge}>{label}</span>

        {/* Name */}
        <h1 className={styles.name}>{t(poi.name, locale)}</h1>

        {/* Date & distance chips */}
        {(poi.datum_von || poi.datum_bis) && (
          <div className={styles.chips}>
            <span className={styles.dateChip}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>history</span>
              {poi.datum_von && poi.datum_von}
              {poi.datum_von && poi.datum_bis && ' — '}
              {poi.datum_bis && poi.datum_bis}
            </span>
          </div>
        )}

        {/* Description */}
        <p className={styles.description}>{t(poi.beschreibung, locale)}</p>

        {/* Audio player */}
        <AudioPlayer src={audioSrc} />

        {/* Wikipedia link */}
        {poi.wikipedia_url && (
          <div className={styles.actions}>
            <a
              href={poi.wikipedia_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryBtn}
            >
              Wikipedia
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
            </a>
          </div>
        )}

        {/* Sources */}
        {poi.quellen && poi.quellen.length > 0 && (
          <div className={styles.sources}>
            <span className={styles.sourcesLabel}>
              {locale === 'en' ? 'Sources' : locale === 'fr' ? 'Sources' : 'Quellen'}
            </span>
            {poi.quellen.map((q, i) => (
              <p key={i} className={styles.sourceItem}>{q}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
