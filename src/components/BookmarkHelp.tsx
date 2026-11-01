'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { detectBookmarkBrowser, BookmarkBrowser, BookmarkContext, BookmarkPlatform } from '@/lib/bookmark-browser'
import { getBookmarkCopy, getBookmarkSteps, getBookmarkBrowserName, getBookmarkPlatformName } from '@/lib/bookmark-copy'
import { useLocaleContext } from '@/lib/LocaleContext'
import { useActiveDialog } from '@/lib/ActiveDialogContext'
import AppIcon from './AppIcon'
import styles from './BookmarkHint.module.css'

export function readBookmarkBrowser(): BookmarkContext {
  const nav = navigator as Navigator & { userAgentData?: { brands?: { brand: string; version: string }[]; platform?: string; mobile?: boolean }; standalone?: boolean }
  return detectBookmarkBrowser({ userAgent: nav.userAgent, userAgentData: nav.userAgentData, platform: nav.platform, maxTouchPoints: nav.maxTouchPoints, standalone: nav.standalone || window.matchMedia('(display-mode: standalone)').matches })
}

const browsers: BookmarkBrowser[] = ['safari', 'chrome', 'firefox', 'edge', 'samsung', 'opera', 'unknown']
const platforms: BookmarkPlatform[] = ['ios', 'android', 'other']

export default function BookmarkHelp({ browser, onClose, onDismiss }: { browser: BookmarkContext; onClose: () => void; onDismiss?: () => void }) {
  const { locale } = useLocaleContext()
  const copy = getBookmarkCopy(locale)
  const [selectedBrowser, setSelectedBrowser] = useState<BookmarkBrowser>(browser.confidence === 'identified' ? browser.browser : 'unknown')
  const [platform, setPlatform] = useState(browser.platform)
  const [choosing, setChoosing] = useState(false)
  const [manual, setManual] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const browserId = useId()
  const platformId = useId()
  const name = getBookmarkBrowserName(selectedBrowser, locale)
  const embedded = browser.embedded && !manual
  const title = embedded ? copy.embeddedTitle : selectedBrowser === 'unknown' ? copy.genericTitle : copy.helpTitle(name)
  const steps = embedded ? copy.embeddedSteps : selectedBrowser === 'unknown' ? copy.genericSteps : getBookmarkSteps(selectedBrowser, platform, locale)

  useEffect(() => {
    const dialog = ref.current!
    const opener = document.activeElement as HTMLElement | null
    const route = `${location.pathname}${location.search}`
    const hasNativeDialog = typeof dialog.showModal === 'function'
    const blocked: HTMLElement[] = []
    if (hasNativeDialog) dialog.showModal()
    else {
      // Older browsers need an inert background as well as a visible dialog.
      dialog.setAttribute('open', '')
      for (const child of Array.from(document.body.children)) {
        if (child instanceof HTMLElement && !child.contains(dialog) && !child.inert) { child.inert = true; blocked.push(child) }
      }
    }
    dialog.querySelector<HTMLButtonElement>('button')?.focus()
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key !== 'Tab') return
      const items = Array.from(dialog.querySelectorAll<HTMLElement>('button, select, [href], [tabindex="0"]')).filter(item => !item.hasAttribute('disabled') && item.getClientRects().length)
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    dialog.addEventListener('keydown', keydown)
    return () => {
      dialog.removeEventListener('keydown', keydown)
      if (hasNativeDialog && dialog.open) dialog.close()
      blocked.forEach(element => { element.inert = false })
      if (route === `${location.pathname}${location.search}` && opener?.isConnected && opener.getClientRects().length && !opener.closest('[inert]')) opener.focus()
    }
    // Closing is controlled by the current dialog owner; avoid reopening on renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <dialog ref={ref} className={styles.dialog} aria-modal="true" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose() }}>
      <header className={styles.dialogHeader}>
        <h2 id={titleId}>{title}</h2>
        <button type="button" className={styles.iconButton} aria-label={copy.close} title={copy.close} onClick={onClose}><AppIcon name="close" /></button>
      </header>
      <ol className={styles.steps}>{steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
      <button type="button" className={styles.other} aria-expanded={choosing} onClick={() => setChoosing(!choosing)}>{copy.chooseOther}</button>
      {choosing && <div className={styles.selectors}>
        <div><label htmlFor={browserId}>{copy.browserLabel}</label><select id={browserId} value={selectedBrowser} onChange={event => { setSelectedBrowser(event.target.value as BookmarkBrowser); setManual(true) }}>{browsers.map(item => <option value={item} key={item}>{getBookmarkBrowserName(item, locale)}</option>)}</select></div>
        <div><label htmlFor={platformId}>{copy.platformLabel}</label><select id={platformId} value={platform} onChange={event => { setPlatform(event.target.value as BookmarkPlatform); setManual(true) }}>{platforms.map(item => <option value={item} key={item}>{getBookmarkPlatformName(item, locale)}</option>)}</select></div>
      </div>}
      <footer className={styles.dialogFooter}><button type="button" className={styles.primary} onClick={onDismiss ?? onClose}>{copy.close}</button></footer>
    </dialog>, document.body,
  )
}

export function BookmarkHelpButton() {
  const { locale, initialized } = useLocaleContext()
  const { activeDialog, openDialog, closeDialog } = useActiveDialog()
  const [browser, setBrowser] = useState<BookmarkContext | null>(null)
  const [open, setOpen] = useState(false)
  const copy = getBookmarkCopy(locale)
  useEffect(() => { if (activeDialog !== 'bookmark') setOpen(false) }, [activeDialog])
  return <>
    <button type="button" className={styles.helpLink} disabled={!initialized} onClick={() => {
      if (openDialog('bookmark')) { setBrowser(readBookmarkBrowser()); setOpen(true) }
    }}>{copy.helpLink}<AppIcon name="chevron_right" /></button>
    {open && browser && activeDialog === 'bookmark' && <BookmarkHelp browser={browser} onClose={() => { setOpen(false); closeDialog('bookmark') }} />}
  </>
}
