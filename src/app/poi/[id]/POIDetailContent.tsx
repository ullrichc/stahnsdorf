'use client'

import Link from 'next/link'
import { POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'
import { resolveImageUrl } from '@/lib/images'
import { formatDateRange, linkifySourceText } from '@/lib/poi-display'
import AudioPlayer from '@/components/AudioPlayer'
import styles from './page.module.css'

export default function POIDetailContent({ poi }: { poi: POI }) {
  const locale = useLocale()
  const dict = useDictionary(locale)

  const audioSrc = (poi.audio && typeof poi.audio === 'object') ? poi.audio[locale] || poi.audio['de'] : undefined
  
  // Resolve localized type labels from the central dictionary mapping
  const getTypeLabel = (typ: string): string => {
    switch (typ) {
      case 'grab': return dict.typeGrab
      case 'bauwerk': return dict.typeBauwerk
      case 'bereich': return dict.typeBereich
      case 'denkmal': return dict.typeDenkmal
      case 'mausoleum': return dict.typeMausoleum
      case 'gedenkanlage': return dict.typeGedenkanlage
      default: return typ
    }
  }
  const label = getTypeLabel(poi.typ)
  const dateRange = formatDateRange(poi.datum_von, poi.datum_bis)

  const renderSource = (source: string) => linkifySourceText(source).map((segment, index) => {
    if (segment.type === 'link') {
      return (
        <a href={segment.href} target="_blank" rel="noopener noreferrer" key={`${segment.href}-${index}`}>
          {segment.text}
        </a>
      )
    }

    return <span key={`${segment.text}-${index}`}>{segment.text}</span>
  })

  return (
    <div className={styles.page}>
      {/* Header with back button */}
      <div className={styles.header}>
        <Link href="/" className={styles.back}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
      </div>

      <div className={styles.content}>
        {/* Type badge */}
        <span className={styles.badge}>{label}</span>

        {/* Name */}
        <h1 className={styles.name}>{t(poi.name, locale)}</h1>

        {/* Date & distance chips */}
        {dateRange && (
          <div className={styles.chips}>
            <span className={styles.dateChip}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>history</span>
              {dateRange}
            </span>
          </div>
        )}

        {/* Description */}
        <div className={styles.textBlock}>
          <p className={styles.description}>{t(poi.beschreibung, locale)}</p>
        </div>

        {/* Audio player */}
        <AudioPlayer src={audioSrc} />

        {/* Images */}
        {poi.bilder && poi.bilder.length > 0 && (
          <div className={styles.gallery}>
            {poi.bilder.map((image, index) => {
              const imageUrl = resolveImageUrl(image.datei)
              const caption = image.beschriftung ? t(image.beschriftung, locale) : ''
              return (
                <figure className={styles.galleryItem} key={`${image.storage_pfad ?? image.datei}-${index}`}>
                  {imageUrl && <img src={imageUrl} alt={caption || t(poi.name, locale)} />}
                  {(caption || image.nachweis) && (
                    <figcaption>
                      {caption && <span className={styles.caption}>{caption}</span>}
                      {image.nachweis_url ? (
                        <a href={image.nachweis_url} target="_blank" rel="noopener noreferrer">
                          © {image.nachweis}
                        </a>
                      ) : (
                        <span>© {image.nachweis}</span>
                      )}
                    </figcaption>
                  )}
                </figure>
              )
            })}
          </div>
        )}

        {poi.lagehinweis && (
          <div className={styles.locationHint}>
            <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
            <div>
              <span className={styles.locationLabel}>{dict.locationHint}</span>
              <p>{poi.lagehinweis}</p>
            </div>
          </div>
        )}

        {/* Wikipedia link */}
        {poi.wikipedia_url && (
          <div className={styles.actions}>
            <a
              href={poi.wikipedia_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryBtn}
            >
              Wikipedia
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
            </a>
          </div>
        )}

        {/* Sources */}
        {poi.quellen && poi.quellen.length > 0 && (
          <div className={styles.sources}>
            <span className={styles.sourcesLabel}>
              {dict.sources}
            </span>
            {poi.quellen.map((q, i) => (
              <p key={i} className={styles.sourceItem}>{renderSource(q)}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
