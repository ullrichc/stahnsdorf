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

export default function POICard({ poi, onClose }: Props) {
  const locale = useLocale()
  const dict = useDictionary(locale)

  if (!poi) return null

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

        <p className={styles.summary}>{t(poi.kurztext, locale)}</p>

        {poi.lagehinweis && (
          <p className={styles.locationHint}>
            <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
            <span>
              <strong>{dict.locationHint}:</strong> {poi.lagehinweis}
            </span>
          </p>
        )}

        <div className={styles.actions}>
          <Link href={`/poi/${poi.id}`} className={styles.primaryBtn}>
            <span>{dict.learnMore}</span>
            <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
