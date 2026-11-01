'use client'

import { createContext, ReactNode, Suspense, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

type DialogKind = 'bookmark' | 'lightbox'
type DialogState = {
  activeDialog: DialogKind | null
  openDialog: (kind: DialogKind) => boolean
  closeDialog: (kind: DialogKind) => void
  unavailable: boolean
  setPageUnavailable: (id: string, blocked: boolean) => void
}
const Context = createContext<DialogState>({ activeDialog: null, openDialog: () => true, closeDialog: () => {}, unavailable: false, setPageUnavailable: () => {} })

function RouteReset({ reset }: { reset: () => void }) {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  useEffect(reset, [pathname, search, reset])
  return null
}

export function ActiveDialogProvider({ children }: { children: ReactNode }) {
  const [activeDialog, setActiveDialog] = useState<DialogKind | null>(null)
  const current = useRef<DialogKind | null>(null)
  const pages = useRef(new Set<string>())
  const [unavailable, setUnavailable] = useState(false)
  const openDialog = useCallback((kind: DialogKind) => {
    if (current.current) return false
    current.current = kind
    setActiveDialog(kind)
    return true
  }, [])
  const closeDialog = useCallback((kind: DialogKind) => {
    if (current.current !== kind) return
    current.current = null
    setActiveDialog(null)
  }, [])
  const reset = useCallback(() => { current.current = null; setActiveDialog(null) }, [])
  const setPageUnavailable = useCallback((id: string, blocked: boolean) => {
    if (blocked) pages.current.add(id)
    else pages.current.delete(id)
    setUnavailable(pages.current.size > 0)
  }, [])
  return (
    <Context.Provider value={{ activeDialog, openDialog, closeDialog, unavailable, setPageUnavailable }}>
      <Suspense fallback={null}><RouteReset reset={reset} /></Suspense>
      {children}
    </Context.Provider>
  )
}

export const useActiveDialog = () => useContext(Context)

export function useBookmarkPageUnavailable(blocked = true) {
  const id = useId()
  const { setPageUnavailable } = useActiveDialog()
  useEffect(() => {
    setPageUnavailable(id, blocked)
    return () => setPageUnavailable(id, false)
  }, [id, blocked, setPageUnavailable])
}
