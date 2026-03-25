import { getCollectionById, getAllCollections } from '@/lib/content'
import DynamicMapView from '@/components/DynamicMapView'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { t } from '@/lib/i18n'
import styles from './page.module.css'

export async function generateStaticParams() {
  return getAllCollections().map((collection) => ({
    id: collection.id,
  }))
}

export default async function SammlungPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = getCollectionById(id)

  if (!collection) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Sammlung nicht gefunden</h2>
        <Link href="/sammlungen">Zurück zur Übersicht</Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/sammlungen" className={styles.backButton}>
            {'←'} Zurück
          </Link>
          <h1 className={styles.title}>{t(collection.name)}</h1>
        </div>
      </header>
      <main className={styles.mapContainer}>
        <DynamicMapView poiIds={collection.pois} />
      </main>
    </div>
  )
}
