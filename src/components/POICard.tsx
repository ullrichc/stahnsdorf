'use client'
import Link from 'next/link'
import { POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'
import styles from './POICard.module.css'
import { poiDetailHref } from '@/lib/redirect'
import AppIcon from './AppIcon'

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
    <div className={styles.card} data-testid="poi-card">
      <button className={styles.close} onClick={onClose} aria-label={dict.close}>
        <AppIcon name="close" />
      </button>

      <div className={styles.content}>
        <span className={styles.badge}>{label}</span>
        <h2 className={styles.name}>{t(poi.name, locale)}</h2>

        <p className={styles.summary}>{t(poi.kurztext, locale)}</p>

        {poi.lagehinweis && (
          <p className={styles.locationHint}>
            <AppIcon name="location_on" />
            <span>
              <strong>{dict.locationHint}:</strong> {poi.lagehinweis}
            </span>
          </p>
        )}

        <div className={styles.actions}>
          <Link href={poiDetailHref(poi.id, '/')} className={styles.primaryBtn}>
            <span>{dict.learnMore}</span>
            <AppIcon name="arrow_forward" />
          </Link>
        </div>
      </div>
    </div>
  )
}
