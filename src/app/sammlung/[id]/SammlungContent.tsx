'use client'

import Link from 'next/link'
import { Collection } from '@/lib/types'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'
import { usePOIs } from '@/lib/useFirestore'
import DynamicMapView from '@/components/DynamicMapView'
import styles from './page.module.css'
import AppIcon from '@/components/AppIcon'
import { collectionDetailHref, poiDetailHref } from '@/lib/redirect'
import { getPoiTypeLabel } from '@/lib/poi-type'

export default function SammlungContent({ collection }: { collection: Collection }) {
  const locale = useLocale()
  const dict = useDictionary(locale)
  const { pois, loading, error, retry } = usePOIs()
  const poisById = new Map(pois.map((poi) => [poi.id, poi]))
  const collectionPois = collection.pois.flatMap((id) => {
    const poi = poisById.get(id)
    return poi ? [poi] : []
  })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/sammlungen" className={styles.backButton} aria-label={dict.back}>
            <AppIcon name="arrow_back" />
          </Link>
          <h1 className={styles.title}>{t(collection.name, locale)}</h1>
        </div>
      </header>
      <main className={styles.content}>
        <p className={styles.description}>{t(collection.beschreibung, locale)}</p>

        <section className={styles.places} aria-labelledby="collection-places-title">
          <h2 id="collection-places-title">{dict.collectionPlaces}</h2>
          {loading && <p className={styles.status}>{dict.loadingEntry}</p>}
          {error && (
            <div className={styles.status}>
              <p>{dict.loadErrorBody}</p>
              <button type="button" onClick={retry}>{dict.retry}</button>
            </div>
          )}
          {!loading && !error && (
            <div className={styles.poiList}>
              {collectionPois.map((poi) => (
                <Link
                  href={poiDetailHref(poi.id, collectionDetailHref(collection.id))}
                  className={styles.poiRow}
                  key={poi.id}
                >
                  <span className={styles.poiText}>
                    <span className={styles.poiName}>{t(poi.name, locale)}</span>
                    <span className={styles.poiType}>{getPoiTypeLabel(poi.typ, dict)}</span>
                  </span>
                  <AppIcon name="chevron_right" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {!loading && !error && collectionPois.length > 0 && (
          <section className={styles.mapSection} aria-labelledby="collection-map-title">
            <h2 id="collection-map-title">{dict.collectionMap}</h2>
            <div className={styles.mapContainer}>
              <DynamicMapView poiIds={collectionPois.map((poi) => poi.id)} />
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
