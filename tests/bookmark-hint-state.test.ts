import { beforeEach, describe, test, expect, vi } from 'vitest'
import { getBookmarkHintKey, hasDismissedBookmarkHint, dismissBookmarkHint } from '../src/lib/bookmark-hint-state'

type HintStorage = Pick<Storage, 'getItem' | 'setItem'>

function memoryStorage(): HintStorage {
  const values = new Map<string, string>()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
  }
}

function blockedStorage(): HintStorage {
  return {
    getItem: () => { throw new DOMException('Blocked', 'SecurityError') },
    setItem: () => { throw new DOMException('Blocked', 'SecurityError') },
  }
}

const blockedGetter = (): HintStorage => { throw new DOMException('Blocked property', 'SecurityError') }

describe('bookmark hint state', () => {
  let key: string
  let sequence = 0

  beforeEach(() => {
    key = getBookmarkHintKey(`/test-${sequence++}`)
  })

  test.each(['', '/stahnsdorf', '/files/app'])('namespaces key by base path %s', basePath => {
    expect(getBookmarkHintKey(basePath)).toBe(`swk:${basePath}:bookmark-hint:v1`)
  })

  test('fresh storage is not dismissed and reading does not write', () => {
    const storage = memoryStorage()
    const write = vi.spyOn(storage, 'setItem')
    expect(hasDismissedBookmarkHint(key, [() => storage])).toBe(false)
    expect(write).not.toHaveBeenCalled()
  })

  test('explicit dismissal persists across module reload', async () => {
    const local = memoryStorage()
    dismissBookmarkHint(key, [() => local])
    vi.resetModules()
    const reloaded = await import('../src/lib/bookmark-hint-state')
    expect(reloaded.hasDismissedBookmarkHint(key, [() => local])).toBe(true)
  })

  test('successful local write does not require session storage', () => {
    const local = memoryStorage()
    const session = vi.fn(blockedGetter)
    dismissBookmarkHint(key, [() => local, session])
    expect(local.getItem(key)).not.toBeNull()
    expect(session).not.toHaveBeenCalled()
  })

  test('property SecurityError falls back to session storage', async () => {
    const session = memoryStorage()
    dismissBookmarkHint(key, [blockedGetter, () => session])
    vi.resetModules()
    const reloaded = await import('../src/lib/bookmark-hint-state')
    expect(reloaded.hasDismissedBookmarkHint(key, [blockedGetter, () => session])).toBe(true)
  })

  test('method SecurityError falls back to session storage', async () => {
    const local = blockedStorage()
    const session = memoryStorage()
    dismissBookmarkHint(key, [() => local, () => session])
    vi.resetModules()
    const reloaded = await import('../src/lib/bookmark-hint-state')
    expect(reloaded.hasDismissedBookmarkHint(key, [() => local, () => session])).toBe(true)
  })

  test('local null must not hide persisted session dismissal after local write failure', async () => {
    const local: HintStorage = {
      getItem: () => null,
      setItem: () => { throw new DOMException('Full', 'QuotaExceededError') },
    }
    const session = memoryStorage()
    dismissBookmarkHint(key, [() => local, () => session])
    vi.resetModules()
    const reloaded = await import('../src/lib/bookmark-hint-state')
    expect(reloaded.hasDismissedBookmarkHint(key, [() => local, () => session])).toBe(true)
  })

  test('blocked session does not erase a local confirmation', () => {
    const local = memoryStorage()
    dismissBookmarkHint(key, [() => local])
    expect(hasDismissedBookmarkHint(key, [() => local, blockedGetter])).toBe(true)
  })

  test('both blocked stores retain dismissal per key in module memory', () => {
    expect(hasDismissedBookmarkHint(key, [blockedGetter, () => blockedStorage()])).toBe(false)
    dismissBookmarkHint(key, [blockedGetter, () => blockedStorage()])
    expect(hasDismissedBookmarkHint(key, [blockedGetter, () => blockedStorage()])).toBe(true)
    expect(hasDismissedBookmarkHint(`${key}-other`, [blockedGetter])).toBe(false)
  })

  test('successful storage writes also survive later storage unavailability', () => {
    dismissBookmarkHint(key, [() => memoryStorage()])
    expect(hasDismissedBookmarkHint(key, [blockedGetter])).toBe(true)
  })

  test('persisted confirmation remains known when storage subsequently fails', () => {
    const local = memoryStorage()
    dismissBookmarkHint(`${key}-source`, [() => local])
    const saved = local.getItem(`${key}-source`)!
    local.setItem(key, saved)
    expect(hasDismissedBookmarkHint(key, [() => local])).toBe(true)
    expect(hasDismissedBookmarkHint(key, [blockedGetter])).toBe(true)
  })

  test('different deployments do not share confirmation', () => {
    const local = memoryStorage()
    dismissBookmarkHint(getBookmarkHintKey('/stahnsdorf'), [() => local])
    expect(hasDismissedBookmarkHint(getBookmarkHintKey('/files/app'), [() => local])).toBe(false)
  })

  test('no browser or storage is needed at import or for memory fallback', () => {
    expect(typeof window).toBe('undefined')
    expect(hasDismissedBookmarkHint(key, [])).toBe(false)
    dismissBookmarkHint(key, [])
    expect(hasDismissedBookmarkHint(key, [])).toBe(true)
  })
})
