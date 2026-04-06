'use client'
import Link from 'next/link'
import { Collection, POI } from '@/lib/types'
import { usePOIs } from '@/lib/useFirestore'
import { useGeolocation } from '@/lib/useGeolocation'
import { getDistanceMeters, formatDistance } from '@/lib/geo'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import styles from './CollectionList.module.css'

type Props = {
  collections: Collection[]
}

export default function CollectionList({ collections }: Props) {
  const { location } = useGeolocation()
  const locale = useLocale()
  const { pois } = usePOIs()

  const getPOI = (id: string) => pois.find(p => p.id === id)

  const headingText = locale === 'en' ? 'Collections' : locale === 'fr' ? 'Collections' : 'Sammlungen'
  const subtitleText = locale === 'en' ? 'Thematic trails through the heritage site.' : locale === 'fr' ? 'Parcours thématiques à travers le site.' : 'Thematische Pfade durch das Flächendenkmal.'
  const sitesText = locale === 'en' ? 'sites' : locale === 'fr' ? 'sites' : 'Orte'
  const nearestText = locale === 'en' ? 'Nearest:' : locale === 'fr' ? 'Plus proche :' : 'Nächstes:'
  const awayText = locale === 'en' ? 'away' : locale === 'fr' ? 'de distance' : 'entfernt'

  return (
    <div className={styles.container}>
      {/* Editorial Header */}
      <header className={styles.header}>
        <div className={styles.headerLabel}>
          <span className={styles.labelRule} />
          <span className={styles.labelText}>
            {locale === 'en' ? 'Archive of Eternity' : locale === 'fr' ? 'Archive de l\'Éternité' : 'Archiv der Ewigkeit'}
          </span>
        </div>
        <h1 className={styles.heading}>{headingText}</h1>
        <p className={styles.subtitle}>{subtitleText}</p>
      </header>

      <div className={styles.list}>
        {collections.map((collection) => {
          let minDistance = Infinity
          if (location) {
            collection.pois.forEach(id => {
              const p = getPOI(id)
              if (p && p.koordinaten) {
                const d = getDistanceMeters(location.lat, location.lng, p.koordinaten.lat, p.koordinaten.lng)
                if (d < minDistance) minDistance = d
              }
            })
          }

          return (
            <Link key={collection.id} href={`/sammlung/${collection.id}`} className={styles.card}>
              <div className={styles.cardContent}>
                <h2 className={styles.name}>{t(collection.name, locale)}</h2>
                <p className={styles.description}>{t(collection.beschreibung, locale)}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.countPill}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                    {collection.pois.length} {sitesText}
                  </span>
                  {location && minDistance !== Infinity && (
                    <span className={styles.distanceTag}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>directions_walk</span>
                      {nearestText} {formatDistance(minDistance)} {awayText}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.arrowWrap}>
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
