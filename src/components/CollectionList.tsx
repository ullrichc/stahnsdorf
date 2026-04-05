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
  const gravesText = locale === 'en' ? 'Graves' : locale === 'fr' ? 'Tombes' : 'Gräber'
  const nearestText = locale === 'en' ? 'Nearest target:' : locale === 'fr' ? 'Cible la plus proche :' : 'Nächstes Ziel:'
  const awayText = locale === 'en' ? 'away' : locale === 'fr' ? 'de distance' : 'entfernt'
  const containsText = locale === 'en' ? 'Contains:' : locale === 'fr' ? 'Contient :' : 'Enthält:'

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>{headingText}</h1>
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

          const poiNames = collection.pois
            .map(id => getPOI(id))
            .filter(Boolean)
            .map(poi => t(poi!.name, locale))
            .join(', ')
            
          return (
            <Link key={collection.id} href={`/sammlung/${collection.id}`} className={styles.card}>
              <h2 className={styles.name}>{t(collection.name, locale)}</h2>
              <p className={styles.description}>{t(collection.beschreibung, locale)}</p>
              <div className={styles.meta}>
                <span>{'\u{1F4CD}'} {collection.pois.length} {gravesText}</span>
              </div>
              {location && minDistance !== Infinity && (
                <div className={styles.distanceHighlight}>
                  ✨ {nearestText} {formatDistance(minDistance)} {awayText}
                </div>
              )}
              <p className={styles.preview}>{containsText} {poiNames}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
