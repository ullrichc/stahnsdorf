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
  grave: { de: 'Grabstätte', en: 'Grave', fr: 'Tombe' },
  building: { de: 'Gebäude', en: 'Building', fr: 'Bâtiment' },
  landmark: { de: 'Orientierungspunkt', en: 'Landmark', fr: 'Point de repère' },
  nature: { de: 'Natur', en: 'Nature', fr: 'Nature' },
  section: { de: 'Bereich', en: 'Section', fr: 'Section' },
  memorial: { de: 'Denkmal', en: 'Memorial', fr: 'Mémorial' },
  mausoleum: { de: 'Mausoleum', en: 'Mausoleum', fr: 'Mausolée' },
}

import { useGeolocation } from '@/lib/useGeolocation'
import { getDistanceMeters, formatDistance } from '@/lib/geo'

export default function POICard({ poi, onClose }: Props) {
  const { location } = useGeolocation()
  const locale = useLocale()

  if (!poi) return null

  const distance = (location && poi.coordinates) ? getDistanceMeters(location.lat, location.lng, poi.coordinates[0], poi.coordinates[1]) : null
  const label = typeLabels[poi.type]?.[locale] || typeLabels[poi.type]?.de || poi.type
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
      {poi.dates && (
        <p className={styles.dates}>
          {poi.dates.born && `* ${poi.dates.born.slice(0, 4)}`}
          {poi.dates.born && poi.dates.died && ' \u2013 '}
          {poi.dates.died && `\u2020 ${poi.dates.died.slice(0, 4)}`}
        </p>
      )}
      <p className={styles.summary}>{t(poi.summary, locale)}</p>
      <Link href={`/poi/${poi.id}`} className={styles.detail}>
        {locale === 'en' ? 'Learn more' : locale === 'fr' ? 'En savoir plus' : 'Mehr erfahren'} {'→'}
      </Link>
    </div>
  )
}
