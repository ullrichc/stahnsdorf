'use client'
import Link from 'next/link'
import { Collection } from '@/lib/types'
import { usePOIs } from '@/lib/useFirestore'
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
  const locale = useLocale()
  const { pois, loading: poisLoading, error: poisError, retry: retryPois } = usePOIs()
  const dict = useDictionary(locale)
  const mappablePoiIds = new Set(pois.map((poi) => poi.id))

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
        {poisError && (
          <div className={styles.dataError} role="alert">
            <p>{dict.loadErrorBody}</p>
            <button type="button" onClick={retryPois}>{dict.retry}</button>
          </div>
        )}
        {collections.map((collection) => {
          const visiblePoiCount = collection.pois.filter((id) => mappablePoiIds.has(id)).length

          return (
            <Link key={collection.id} href={collectionDetailHref(collection.id)} className={styles.card}>
              <div className={styles.cardContent}>
                <h2 className={styles.name}>{t(collection.name, locale)}</h2>
                <p className={styles.description}>{t(collection.beschreibung, locale)}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.countPill}>
                    <AppIcon name="location_on" style={{ fontSize: '14px' }} />
                    {poisLoading || poisError ? '–' : visiblePoiCount} {dict.sitesCount}
                  </span>
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
