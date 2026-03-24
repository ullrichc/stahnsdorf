'use client'
import Link from 'next/link'
import { POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import styles from './POICard.module.css'

type Props = {
  poi: POI | null
  onClose: () => void
}

const typeLabels: Record<string, string> = {
  grave: 'Grabstätte',
  building: 'Gebäude',
  landmark: 'Orientierungspunkt',
  nature: 'Natur',
}

export default function POICard({ poi, onClose }: Props) {
  if (!poi) return null

  return (
    <div className={styles.card}>
      <button className={styles.close} onClick={onClose} aria-label="Schließen">
        \u2715
      </button>
      <span className={styles.badge}>{typeLabels[poi.type] || poi.type}</span>
      <h2 className={styles.name}>{t(poi.name)}</h2>
      {poi.dates && (
        <p className={styles.dates}>
          {poi.dates.born && `* ${poi.dates.born.slice(0, 4)}`}
          {poi.dates.born && poi.dates.died && ' \u2013 '}
          {poi.dates.died && `\u2020 ${poi.dates.died.slice(0, 4)}`}
        </p>
      )}
      <p className={styles.summary}>{t(poi.summary)}</p>
      <Link href={`/poi/${poi.id}`} className={styles.detail}>
        Mehr erfahren \u2192
      </Link>
    </div>
  )
}
