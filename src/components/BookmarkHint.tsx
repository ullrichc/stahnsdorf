'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLocaleContext } from '@/lib/LocaleContext'
import { useActiveDialog } from '@/lib/ActiveDialogContext'
import { getAppBasePath } from '@/lib/app-path'
import { dismissBookmarkHint, getBookmarkHintKey, hasDismissedBookmarkHint } from '@/lib/bookmark-hint-state'
import { getBookmarkCopy } from '@/lib/bookmark-copy'
import type { BookmarkContext } from '@/lib/bookmark-browser'
import BookmarkHelp, { readBookmarkBrowser } from './BookmarkHelp'
import styles from './BookmarkHint.module.css'

const storage = [() => window.localStorage, () => window.sessionStorage]

export default function BookmarkHint() {
  const { locale, initialized } = useLocaleContext()
  const { activeDialog, unavailable, openDialog, closeDialog } = useActiveDialog()
  const pathname = usePathname() ?? ''
  const [browser, setBrowser] = useState<BookmarkContext | null>(null)
  const [dismissed, setDismissed] = useState(true)
  const [helpOpen, setHelpOpen] = useState(false)
  const key = getBookmarkHintKey(getAppBasePath())
  const copy = getBookmarkCopy(locale)
  useEffect(() => {
    setBrowser(readBookmarkBrowser())
    setDismissed(hasDismissedBookmarkHint(key, storage))
    const sync = () => setDismissed(hasDismissedBookmarkHint(key, storage))
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [key])
  const publicRoute = /^\/(?:$|info\/?$|einstellungen\/?$|sammlungen\/?$|poi(?:\/|$)|sammlung(?:\/|$))/.test(pathname)
  const visible = initialized && browser?.mobile && !browser.standalone && !dismissed && publicRoute && !unavailable
  useEffect(() => {
    if (activeDialog !== 'bookmark') setHelpOpen(false)
    if (helpOpen && !visible) { setHelpOpen(false); closeDialog('bookmark') }
    if (!publicRoute || unavailable) { setHelpOpen(false); closeDialog('bookmark') }
  }, [activeDialog, publicRoute, unavailable, closeDialog, visible, helpOpen])
  function dismiss() {
    dismissBookmarkHint(key, storage)
    setDismissed(true)
    setHelpOpen(false)
    closeDialog('bookmark')
  }
  // Keep the opener mounted while its own dialog is active so focus can return.
  if (!visible) return null
  return (
    <>
      <aside className={styles.hint} data-testid="bookmark-hint" aria-label={copy.title} hidden={activeDialog === 'lightbox'}>
        <div className={styles.message}><strong>{copy.title}</strong><p>{copy.body}</p></div>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => { if (openDialog('bookmark')) setHelpOpen(true) }}>{copy.howTo}</button>
          <button type="button" className={styles.secondary} onClick={dismiss}>{copy.close}</button>
        </div>
      </aside>
      {helpOpen && activeDialog === 'bookmark' && <BookmarkHelp browser={browser} onClose={() => { setHelpOpen(false); closeDialog('bookmark') }} onDismiss={dismiss} />}
    </>
  )
}
