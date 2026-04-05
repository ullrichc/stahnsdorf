'use client'
import Link from 'next/link'
import { POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import styles from './POICard.module.css'

type Props = {
  poi: POI | null
  onClose: () => void
}

const typeLabels: Record<string, Record<string, string>> = {
  grab: { de: 'Grabstätte', en: 'Grave', fr: 'Tombe' },
  bauwerk: { de: 'Bauwerk', en: 'Building', fr: 'Bâtiment' },
  bereich: { de: 'Bereich', en: 'Section', fr: 'Section' },
  denkmal: { de: 'Denkmal', en: 'Memorial', fr: 'Mémorial' },
  mausoleum: { de: 'Mausoleum', en: 'Mausoleum', fr: 'Mausolée' },
  gedenkanlage: { de: 'Gedenkanlage', en: 'Memorial site', fr: 'Lieu de mémoire' },
}

import { useGeolocation } from '@/lib/useGeolocation'
import { getDistanceMeters, formatDistance } from '@/lib/geo'

export default function POICard({ poi, onClose }: Props) {
  const { location } = useGeolocation()
  const locale = useLocale()

  if (!poi) return null

  const distance = (location && poi.koordinaten) ? getDistanceMeters(location.lat, location.lng, poi.koordinaten.lat, poi.koordinaten.lng) : null
  const label = typeLabels[poi.typ]?.[locale] || typeLabels[poi.typ]?.de || poi.typ
  const awayText = locale === 'en' ? 'away' : locale === 'fr' ? 'de distance' : 'entfernt'

  return (
    <div className={styles.card}>
      <button className={styles.close} onClick={onClose} aria-label="Schließen">
        {'✕'}
      </button>
      <div className={styles.tagsContainer}>
        <span className={styles.badge}>{label}</span>
        {distance !== null && (
          <span className={styles.distanceBadge}>📍 {formatDistance(distance)} {awayText}</span>
        )}
      </div>
      <h2 className={styles.name}>{t(poi.name, locale)}</h2>
      {(poi.datum_von || poi.datum_bis) && (
        <p className={styles.dates}>
          {poi.datum_von && `* ${poi.datum_von.slice(0, 4)}`}
          {poi.datum_von && poi.datum_bis && ' \u2013 '}
          {poi.datum_bis && `\u2020 ${poi.datum_bis.slice(0, 4)}`}
        </p>
      )}
      <p className={styles.summary}>{t(poi.kurztext, locale)}</p>
      <Link href={`/poi/${poi.id}`} className={styles.detail}>
        {locale === 'en' ? 'Learn more' : locale === 'fr' ? 'En savoir plus' : 'Mehr erfahren'} {'→'}
      </Link>
    </div>
  )
}
