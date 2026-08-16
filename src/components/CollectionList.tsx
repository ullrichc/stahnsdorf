'use client'
import Link from 'next/link'
import { Collection, POI } from '@/lib/types'
import { usePOIs } from '@/lib/useFirestore'
import { useGeolocation } from '@/lib/useGeolocation'
import { getDistanceMeters, formatDistance } from '@/lib/geo'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'
import styles from './CollectionList.module.css'
import { collectionDetailHref } from '@/lib/redirect'
import AppIcon from './AppIcon'

type Props = {
  collections: Collection[]
}

export default function CollectionList({ collections }: Props) {
  const { location, error: locationError } = useGeolocation()
  const locale = useLocale()
  const { pois } = usePOIs()
  const dict = useDictionary(locale)

  const getPOI = (id: string) => pois.find(p => p.id === id)

  return (
    <div className={styles.container}>
      {/* Editorial Header */}
      <header className={styles.header}>
        <div className={styles.headerLabel}>
          <span className={styles.labelRule} />
          <span className={styles.labelText}>
            Südwestkirchhof Stahnsdorf
          </span>
        </div>
        <h1 className={styles.heading}>{dict.collectionsTitle}</h1>
        <p className={styles.subtitle}>{dict.collectionsSubtitle}</p>
      </header>

      <div className={styles.list}>
        {locationError !== null && (
          <p role="status">
            {locationError === 0 ? dict.locationUnavailable : dict.locationError}
          </p>
        )}
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
            <Link key={collection.id} href={collectionDetailHref(collection.id)} className={styles.card}>
              <div className={styles.cardContent}>
                <h2 className={styles.name}>{t(collection.name, locale)}</h2>
                <p className={styles.description}>{t(collection.beschreibung, locale)}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.countPill}>
                    <AppIcon name="location_on" style={{ fontSize: '14px' }} />
                    {collection.pois.length} {dict.sitesCount}
                  </span>
                  {location && minDistance !== Infinity && (
                    <span className={styles.distanceTag}>
                      <AppIcon name="directions_walk" style={{ fontSize: '14px' }} />
                      {dict.nearest} {formatDistance(minDistance, dict.currentLocation)} {dict.away}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.arrowWrap}>
                <AppIcon name="arrow_forward" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
