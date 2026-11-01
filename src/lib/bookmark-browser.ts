export type BookmarkBrowser = 'safari' | 'chrome' | 'firefox' | 'edge' | 'samsung' | 'opera' | 'unknown'
export type BookmarkPlatform = 'ios' | 'android' | 'other'

export type BookmarkBrowserInput = {
  userAgent: string
  userAgentData?: {
    brands?: { brand: string; version: string }[]
    platform?: string
    mobile?: boolean
  }
  platform?: string
  maxTouchPoints?: number
  standalone?: boolean
}

export type BookmarkContext = {
  browser: BookmarkBrowser
  platform: BookmarkPlatform
  mobile: boolean
  embedded: boolean
  standalone: boolean
  confidence: 'identified' | 'uncertain'
}

function platformFrom(value: string): BookmarkPlatform | undefined {
  if (/iPhone|iPad|iPod|iOS/i.test(value)) return 'ios'
  if (/Android/i.test(value)) return 'android'
  if (/Windows|Win32|Win64|Mac|Linux|Chrome OS|CrOS/i.test(value)) return 'other'
  return undefined
}

export function detectBookmarkBrowser(input: BookmarkBrowserInput): BookmarkContext {
  const ua = input.userAgent
  const ipad = /iPad/i.test(ua)
    || (/MacIntel|Macintosh/i.test(`${input.platform ?? ''} ${ua}`) && (input.maxTouchPoints ?? 0) > 1)
  const uaPlatform = ipad ? 'ios' : platformFrom(ua)
  // Android browsers can expose their Linux kernel through navigator.platform.
  const navigatorPlatform = ipad ? 'ios'
    : uaPlatform === 'android' && /^Linux\b/i.test(input.platform ?? '') ? undefined
    : platformFrom(input.platform ?? '')
  const hintPlatform = platformFrom(input.userAgentData?.platform ?? '')
  const platforms = [uaPlatform, navigatorPlatform, hintPlatform].filter(value => value !== undefined)
  const platform = uaPlatform ?? navigatorPlatform ?? hintPlatform ?? 'other'
  const embedded = /;\s*wv\b|\bFBAN\b|\bFBAV\b|Instagram|Line\/|MicroMessenger|Twitter|TikTok/i.test(ua)
  const context: BookmarkContext = {
    browser: 'unknown',
    platform,
    mobile: platform === 'ios' || platform === 'android' || /Mobile/i.test(ua) || input.userAgentData?.mobile === true,
    embedded,
    standalone: input.standalone === true,
    confidence: 'uncertain',
  }

  // Chromium derivatives also advertise Chrome/Safari; only their explicit
  // product tokens count as distinct signals here.
  const specific: BookmarkBrowser[] = []
  if (/SamsungBrowser\//i.test(ua)) specific.push('samsung')
  if (/EdgA?\/|EdgiOS\//i.test(ua)) specific.push('edge')
  if (/OPR\/|OPiOS\//i.test(ua)) specific.push('opera')
  if (/Firefox\/|FxiOS\//i.test(ua)) specific.push('firefox')
  if (/CriOS\//i.test(ua)) specific.push('chrome')

  const brands = new Map<string, BookmarkBrowser>([
    ['google chrome', 'chrome'],
    ['microsoft edge', 'edge'],
    ['samsung internet', 'samsung'],
    ['opera', 'opera'],
    ['firefox', 'firefox'],
  ])
  const hinted = new Set<BookmarkBrowser>()
  for (const { brand } of input.userAgentData?.brands ?? []) {
    const browser = brands.get(brand.toLowerCase())
    if (browser) hinted.add(browser)
  }

  const uaBrowser = specific[0]
    ?? (/Chrome\//i.test(ua) ? 'chrome' : /Version\/[\d.]+.*Safari\//i.test(ua) ? 'safari' : 'unknown')
  const hintBrowser = [...hinted][0]
  const conflictingBrowser = specific.length > 1 || hinted.size > 1
    || (hintBrowser !== undefined && specific.length > 0 && hintBrowser !== uaBrowser)
    || (hintBrowser !== undefined && uaBrowser === 'safari')

  if (embedded || conflictingBrowser || new Set(platforms).size > 1) return context

  const browser = hintBrowser ?? uaBrowser
  // Safari and unmarked Firefox can send the same iPad UA, including in
  // standalone mode. Touch support identifies the device, not the browser.
  if (browser === 'unknown' || (ipad && browser === 'safari')) return context

  return { ...context, browser, confidence: 'identified' }
}
