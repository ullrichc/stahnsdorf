'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { POI } from '@/lib/types'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'
import { useDictionary } from '@/lib/ui-dictionary'
import { resolveImageUrl } from '@/lib/images'
import { getLightboxNextIndex, getLightboxPreviousIndex, shouldCloseLightbox } from '@/lib/image-lightbox'
import { formatDateRange, linkifySourceText } from '@/lib/poi-display'
import { feedbackFormUrl } from '@/lib/feedback'
import AudioPlayer from '@/components/AudioPlayer'
import styles from './page.module.css'
import AppIcon from '@/components/AppIcon'

export default function POIDetailContent({ poi }: { poi: POI }) {
  const locale = useLocale()
  const dict = useDictionary(locale)
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)
  const lightboxRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

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
  const lightboxOpen = activeImageIndex !== null

  useEffect(() => {
    if (!lightboxOpen) return

    const scrollY = window.scrollY
    const previousStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (shouldCloseLightbox(event.key)) {
        event.preventDefault()
        setActiveImageIndex(null)
        return
      }

      if (event.key === 'Tab') {
        const focusable = Array.from(
          lightboxRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [],
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
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
      document.body.style.overflow = previousStyles.overflow
      document.body.style.position = previousStyles.position
      document.body.style.top = previousStyles.top
      document.body.style.width = previousStyles.width
      window.scrollTo(0, scrollY)
      window.removeEventListener('keydown', handleKeyDown)
      openerRef.current?.focus()
    }
  }, [lightboxOpen, images.length])

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
        <Link href="/" className={styles.back} aria-label={dict.back}>
          <AppIcon name="arrow_back" />
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
              <AppIcon name="history" style={{ fontSize: '14px' }} />
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
                      onClick={(event) => {
                        openerRef.current = event.currentTarget
                        setActiveImageIndex(index)
                      }}
                      aria-label={`${caption || poiName}: ${dict.enlargeImage}`}
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
            ref={lightboxRef}
            role="dialog"
            aria-modal="true"
            aria-label={dict.imageViewer}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setActiveImageIndex(null)
            }}
          >
            <div className={styles.lightboxChrome}>
              <button
                type="button"
                ref={closeButtonRef}
                className={styles.lightboxIconButton}
                onClick={() => setActiveImageIndex(null)}
                aria-label={dict.close}
              >
                <AppIcon name="close" />
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
                  aria-label={dict.previousImage}
                >
                  <AppIcon name="chevron_left" />
                </button>
                <button
                  type="button"
                  className={`${styles.lightboxNavButton} ${styles.lightboxNavNext}`}
                  onClick={() => setActiveImageIndex((current) =>
                    current === null ? current : getLightboxNextIndex(current, images.length),
                  )}
                  aria-label={dict.nextImage}
                >
                  <AppIcon name="chevron_right" />
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
                    <button type="button" onClick={() => zoomOut()} aria-label={dict.zoomOut}>
                      <AppIcon name="zoom_out" />
                    </button>
                    <button type="button" onClick={() => resetTransform()} aria-label={dict.resetView}>
                      <AppIcon name="center_focus_strong" />
                    </button>
                    <button type="button" onClick={() => zoomIn()} aria-label={dict.zoomIn}>
                      <AppIcon name="zoom_in" />
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
            <AppIcon name="location_on" />
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
              <AppIcon name="open_in_new" style={{ fontSize: '16px' }} />
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

        <div className={styles.feedback}>
          <p>{dict.poiFeedbackText}</p>
          <a
            href={feedbackFormUrl(poiName)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.feedbackLink}
          >
            {dict.poiFeedbackLink}
            <AppIcon name="open_in_new" style={{ fontSize: '16px' }} />
          </a>
        </div>
      </div>
    </div>
  )
}
