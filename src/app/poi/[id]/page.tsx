import Link from 'next/link'
import { getAllPOIs, getPOIById } from '@/lib/content'
import { t } from '@/lib/i18n'
import AudioPlayer from '@/components/AudioPlayer'
import styles from './page.module.css'

const typeIcons: Record<string, string> = {
  grave: '\u{1FAA6}',
  building: '\u26EA',
  landmark: '\u{1F4CC}',
  nature: '\u{1F333}',
}

const typeLabels: Record<string, string> = {
  grave: 'Grabstätte',
  building: 'Gebäude',
  landmark: 'Orientierungspunkt',
  nature: 'Natur',
}

export function generateStaticParams() {
  return getAllPOIs().map((poi) => ({ id: poi.id }))
}

export default async function POIDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poi = getPOIById(id)

  if (!poi) {
    return (
      <div className={styles.notFound}>
        <h2>Nicht gefunden</h2>
        <p>Dieser Punkt wurde nicht gefunden.</p>
        <Link href="/">Zurück zur Karte</Link>
      </div>
    )
  }

  const audioSrc = (poi.audio && poi.audio.length > 0) ? poi.audio[0] : undefined

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/" className={styles.back}>{'\u2190'}</Link>
        <span>{typeIcons[poi.type] || '\u{1F4CC}'}</span>
      </div>
      <div className={styles.content}>
        <span className={styles.badge}>{typeLabels[poi.type] || poi.type}</span>
        <h1 className={styles.name}>{t(poi.name)}</h1>
        {poi.dates && (
          <p className={styles.dates}>
            {poi.dates.born && `* ${poi.dates.born}`}
            {poi.dates.born && poi.dates.died && ' \u2013 '}
            {poi.dates.died && `\u2020 ${poi.dates.died}`}
          </p>
        )}
        <p className={styles.description}>{t(poi.description)}</p>
        <AudioPlayer src={audioSrc} />
        {poi.tags && poi.tags.length > 0 && (
          <div className={styles.tags}>
            {poi.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
