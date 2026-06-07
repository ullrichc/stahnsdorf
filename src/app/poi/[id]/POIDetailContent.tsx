'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'
import { resolveImageUrl } from '@/lib/images'
import { getLightboxNextIndex, getLightboxPreviousIndex, shouldCloseLightbox } from '@/lib/image-lightbox'
import { formatDateRange, linkifySourceText } from '@/lib/poi-display'
import AudioPlayer from '@/components/AudioPlayer'
import styles from './page.module.css'

export default function POIDetailContent({ poi }: { poi: POI }) {
  const locale = useLocale()
  const dict = useDictionary(locale)
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)

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
  const images = poi.bilder ?? []
  const activeImage = activeImageIndex !== null ? images[activeImageIndex] : undefined
  const activeImageUrl = resolveImageUrl(activeImage?.datei)
  const activeImageCaption = activeImage?.beschriftung ? t(activeImage.beschriftung, locale) : ''
  const activeImagePosition = activeImageIndex ?? 0
  const poiName = t(poi.name, locale)
  const hasMultipleImages = images.length > 1

  useEffect(() => {
    if (activeImageIndex === null) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (shouldCloseLightbox(event.key)) {
        setActiveImageIndex(null)
        return
      }

      if (event.key === 'ArrowRight') {
        setActiveImageIndex((current) =>
          current === null ? current : getLightboxNextIndex(current, images.length),
        )
      }

      if (event.key === 'ArrowLeft') {
        setActiveImageIndex((current) =>
          current === null ? current : getLightboxPreviousIndex(current, images.length),
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeImageIndex, images.length])

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
        {images.length > 0 && (
          <div className={styles.gallery}>
            {images.map((image, index) => {
              const imageUrl = resolveImageUrl(image.datei)
              const caption = image.beschriftung ? t(image.beschriftung, locale) : ''
              return (
                <figure className={styles.galleryItem} key={`${image.storage_pfad ?? image.datei}-${index}`}>
                  {imageUrl && (
                    <button
                      type="button"
                      className={styles.galleryButton}
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`${caption || poiName} vergrößern`}
                    >
                      <img src={imageUrl} alt={caption || poiName} />
                    </button>
                  )}
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

        {activeImage && activeImageUrl && (
          <div
            className={styles.lightbox}
            role="dialog"
            aria-modal="true"
            aria-label="Bild vergrößert anzeigen"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setActiveImageIndex(null)
            }}
          >
            <div className={styles.lightboxChrome}>
              <button
                type="button"
                className={styles.lightboxIconButton}
                onClick={() => setActiveImageIndex(null)}
                aria-label="Bild schließen"
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>

            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  className={`${styles.lightboxNavButton} ${styles.lightboxNavPrevious}`}
                  onClick={() => setActiveImageIndex((current) =>
                    current === null ? current : getLightboxPreviousIndex(current, images.length),
                  )}
                  aria-label="Vorheriges Bild"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                </button>
                <button
                  type="button"
                  className={`${styles.lightboxNavButton} ${styles.lightboxNavNext}`}
                  onClick={() => setActiveImageIndex((current) =>
                    current === null ? current : getLightboxNextIndex(current, images.length),
                  )}
                  aria-label="Nächstes Bild"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                </button>
              </>
            )}

            <TransformWrapper
              key={activeImage.storage_pfad ?? activeImage.datei}
              initialScale={1}
              minScale={1}
              maxScale={4}
              centerOnInit
              centerZoomedOut
              wheel={{ step: 0.12 }}
              pinch={{ step: 5 }}
              doubleClick={{ mode: 'toggle', step: 1.8 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className={styles.lightboxZoomControls}>
                    <button type="button" onClick={() => zoomOut()} aria-label="Verkleinern">
                      <span className="material-symbols-outlined" aria-hidden="true">zoom_out</span>
                    </button>
                    <button type="button" onClick={() => resetTransform()} aria-label="Ansicht zurücksetzen">
                      <span className="material-symbols-outlined" aria-hidden="true">center_focus_strong</span>
                    </button>
                    <button type="button" onClick={() => zoomIn()} aria-label="Vergrößern">
                      <span className="material-symbols-outlined" aria-hidden="true">zoom_in</span>
                    </button>
                  </div>
                  <TransformComponent
                    wrapperClass={styles.lightboxTransformWrapper}
                    contentClass={styles.lightboxTransformContent}
                  >
                    <img className={styles.lightboxImage} src={activeImageUrl} alt={activeImageCaption || poiName} />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>

            <div className={styles.lightboxMeta}>
              {hasMultipleImages && (
                <span className={styles.lightboxCounter}>
                  {activeImagePosition + 1} / {images.length}
                </span>
              )}
              {(activeImageCaption || activeImage.nachweis) && (
                <p>
                  {activeImageCaption && <span>{activeImageCaption}</span>}
                  {activeImageCaption && activeImage.nachweis && <span aria-hidden="true"> · </span>}
                  {activeImage.nachweis_url ? (
                    <a href={activeImage.nachweis_url} target="_blank" rel="noopener noreferrer">
                      © {activeImage.nachweis}
                    </a>
                  ) : (
                    activeImage.nachweis && <span>© {activeImage.nachweis}</span>
                  )}
                </p>
              )}
            </div>
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
