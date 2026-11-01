type HintStorage = Pick<Storage, 'getItem' | 'setItem'>

const dismissedKeys = new Set<string>()
const dismissedValue = '1'

export function getBookmarkHintKey(basePath: string): string {
  return `swk:${basePath}:bookmark-hint:v1`
}

export function hasDismissedBookmarkHint(key: string, storages: Array<() => HintStorage>): boolean {
  for (const getStorage of storages) {
    try {
      if (getStorage().getItem(key) === dismissedValue) {
        dismissedKeys.add(key)
        return true
      }
    } catch {
      // Access to the storage property itself can already throw SecurityError.
    }
  }
  return dismissedKeys.has(key)
}

export function dismissBookmarkHint(key: string, storages: Array<() => HintStorage>): void {
  dismissedKeys.add(key)
  for (const getStorage of storages) {
    try {
      getStorage().setItem(key, dismissedValue)
      return
    } catch {
      // Try session storage next, then retain the document-local confirmation.
    }
  }
}
