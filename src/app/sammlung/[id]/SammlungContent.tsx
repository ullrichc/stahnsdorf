'use client'

import Link from 'next/link'
import { Collection } from '@/lib/types'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import DynamicMapView from '@/components/DynamicMapView'
import styles from './page.module.css'

export default function SammlungContent({ collection }: { collection: Collection }) {
  const locale = useLocale()
  const backText = locale === 'en' ? '← Back' : locale === 'fr' ? '← Retour' : '← Zurück'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/sammlungen" className={styles.backButton}>
            {backText}
          </Link>
          <h1 className={styles.title}>{t(collection.name, locale)}</h1>
        </div>
      </header>
      <main className={styles.mapContainer}>
        <DynamicMapView poiIds={collection.pois} />
      </main>
    </div>
  )
}
