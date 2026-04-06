'use client'
import Link from 'next/link'
import { POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'
import styles from './POICard.module.css'

type Props = {
  poi: POI | null
  onClose: () => void
}

// Replaced by dictionary mapping

import { useGeolocation } from '@/lib/useGeolocation'
import { getDistanceMeters, formatDistance } from '@/lib/geo'

export default function POICard({ poi, onClose }: Props) {
  const { location } = useGeolocation()
  const locale = useLocale()
  const dict = useDictionary(locale)

  if (!poi) return null

  const distance = (location && poi.koordinaten) ? getDistanceMeters(location.lat, location.lng, poi.koordinaten.lat, poi.koordinaten.lng) : null
  
  const typeMap: Record<string, string> = {
    grab: dict.typeGrab,
    bauwerk: dict.typeBauwerk,
    bereich: dict.typeBereich,
    denkmal: dict.typeDenkmal,
    mausoleum: dict.typeMausoleum,
    gedenkanlage: dict.typeGedenkanlage,
  }
  const label = typeMap[poi.typ] || poi.typ


  return (
    <div className={styles.card}>
      {/* Drag Handle */}
      <div className={styles.dragHandle}>
        <div className={styles.dragBar} />
      </div>

      <button className={styles.close} onClick={onClose} aria-label="Schließen">
        <span className="material-symbols-outlined">close</span>
      </button>

      <div className={styles.content}>
        <span className={styles.badge}>{label}</span>
        <h2 className={styles.name}>{t(poi.name, locale)}</h2>

        {(poi.datum_von || poi.datum_bis || distance !== null) && (
          <div className={styles.chips}>
            {(poi.datum_von || poi.datum_bis) && (
              <span className={styles.dateChip}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>history</span>
                {poi.datum_von && poi.datum_von.slice(0, 4)}
                {poi.datum_von && poi.datum_bis && ' — '}
                {poi.datum_bis && poi.datum_bis.slice(0, 4)}
              </span>
            )}
            {distance !== null && (
              <span className={styles.distanceChip}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>directions_walk</span>
                {formatDistance(distance)} {dict.away}
              </span>
            )}
          </div>
        )}

        <p className={styles.summary}>{t(poi.kurztext, locale)}</p>

        <div className={styles.actions}>
          <Link href={`/poi/${poi.id}`} className={styles.primaryBtn}>
            {dict.learnMore}
          </Link>
        </div>
      </div>
    </div>
  )
}
