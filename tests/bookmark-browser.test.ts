import { describe, test, expect } from 'vitest'
import { detectBookmarkBrowser, type BookmarkBrowserInput, type BookmarkContext } from '../src/lib/bookmark-browser'

// Synthetic UA fixtures model the identifying tokens documented in the plan;
// they test classification, not a real rendering engine or native browser menus.
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15'
const ipad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15'
const android = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36'
const chrome = `${android} Chrome/130.0.0.0 Mobile Safari/537.36`
const defaults: BookmarkContext = {
  browser: 'unknown', platform: 'other', mobile: false, embedded: false,
  standalone: false, confidence: 'uncertain',
}

const fixtures: Array<{ name: string; input: BookmarkBrowserInput; expected: Partial<BookmarkContext> }> = [
  { name: 'Safari iPhone without client hints', input: { userAgent: `${iphone} Version/18.0 Mobile/15E148 Safari/604.1` }, expected: { browser: 'safari', platform: 'ios', mobile: true, confidence: 'identified' } },
  { name: 'Safari iPad desktop mode is uncertain', input: { userAgent: ipad, platform: 'MacIntel', maxTouchPoints: 5 }, expected: { platform: 'ios', mobile: true } },
  { name: 'Firefox iPad without FxiOS has the identical ambiguous UA', input: { userAgent: ipad, platform: 'MacIntel', maxTouchPoints: 5 }, expected: { platform: 'ios', mobile: true } },
  { name: 'explicit iPad Safari is also uncertain', input: { userAgent: ipad.replace('Macintosh', 'iPad') }, expected: { platform: 'ios', mobile: true } },
  { name: 'standalone iPad stays uncertain', input: { userAgent: ipad, platform: 'MacIntel', maxTouchPoints: 5, standalone: true }, expected: { platform: 'ios', mobile: true, standalone: true } },
  ...(['CriOS', 'FxiOS', 'EdgiOS', 'OPiOS'] as const).map((token, index) => ({
    name: `${token} iOS is not Safari`,
    input: { userAgent: `${iphone} ${token}/130.0 Mobile/15E148 Safari/604.1` },
    expected: { browser: (['chrome', 'firefox', 'edge', 'opera'] as const)[index], platform: 'ios' as const, mobile: true, confidence: 'identified' as const },
  })),
  ...(['', ' Firefox/130.0', ' EdgA/130.0', ' SamsungBrowser/26.0', ' OPR/85.0'] as const).map((token, index) => ({
    name: `Android ${token || 'Chrome'} takes precedence over Chrome token`,
    input: { userAgent: `${chrome}${token}` },
    expected: { browser: (['chrome', 'firefox', 'edge', 'samsung', 'opera'] as const)[index], platform: 'android' as const, mobile: true, confidence: 'identified' as const },
  })),
  { name: 'Android tablet with mobile false hint', input: { userAgent: chrome.replace(' Mobile', ''), userAgentData: { mobile: false, platform: 'Android' } }, expected: { browser: 'chrome', platform: 'android', mobile: true, confidence: 'identified' } },
  // Realistic complete UAs and navigator.platform combinations from the
  // integration regression; client hints are deliberately absent.
  ...(['Linux armv8l', 'Linux armv7l', 'Linux aarch64', 'Linux x86_64']).map(platform => ({
    name: `Android Chrome with ${platform} and no client hints`,
    input: { userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36', platform },
    expected: { browser: 'chrome' as const, platform: 'android' as const, mobile: true, confidence: 'identified' as const },
  })),
  { name: 'Android Firefox with Linux armv8l and no client hints', input: { userAgent: 'Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0', platform: 'Linux armv8l' }, expected: { browser: 'firefox', platform: 'android', mobile: true, confidence: 'identified' } },
  ...(['Win32', 'Win64', 'MacIntel']).map(platform => ({
    name: `Android UA still conflicts with ${platform}`,
    input: { userAgent: chrome, platform },
    expected: { platform: 'android' as const, mobile: true },
  })),
  { name: 'Linux navigator platform does not mask conflicting Windows client hint', input: { userAgent: chrome, platform: 'Linux armv8l', userAgentData: { platform: 'Windows' } }, expected: { platform: 'android', mobile: true } },
  { name: 'desktop Linux remains non-mobile', input: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', platform: 'Linux x86_64' }, expected: { browser: 'chrome', confidence: 'identified' } },
  { name: 'desktop Edge', input: { userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36 Edg/130.0' }, expected: { browser: 'edge', confidence: 'identified' } },
  { name: 'desktop Safari', input: { userAgent: ipad, platform: 'MacIntel', maxTouchPoints: 0 }, expected: { browser: 'safari', confidence: 'identified' } },
  { name: 'unknown desktop', input: { userAgent: 'UnknownBrowser/1.0' }, expected: {} },
  { name: 'empty UA', input: { userAgent: '' }, expected: {} },
  { name: 'WebKit alone is not Safari', input: { userAgent: iphone }, expected: { platform: 'ios', mobile: true } },
  { name: 'Safari without Version is not identified', input: { userAgent: `${iphone} Safari/604.1` }, expected: { platform: 'ios', mobile: true } },
  { name: 'Android WebView', input: { userAgent: `${chrome} ; wv) Version/4.0` }, expected: { platform: 'android', mobile: true, embedded: true } },
  { name: 'Facebook app browser', input: { userAgent: `${iphone} Version/18.0 Safari/604.1 [FBAN/FBIOS;FBAV/1]` }, expected: { platform: 'ios', mobile: true, embedded: true } },
  { name: 'Instagram app browser', input: { userAgent: `${chrome} Instagram 350.0` }, expected: { platform: 'android', mobile: true, embedded: true } },
  { name: 'specific client hint identifies Edge', input: { userAgent: chrome, userAgentData: { brands: [{ brand: 'Chromium', version: '130' }, { brand: 'Microsoft Edge', version: '130' }] } }, expected: { browser: 'edge', platform: 'android', mobile: true, confidence: 'identified' } },
  { name: 'specific Chrome client hint', input: { userAgent: '', userAgentData: { brands: [{ brand: 'Google Chrome', version: '130' }], mobile: true, platform: 'Android' } }, expected: { browser: 'chrome', platform: 'android', mobile: true, confidence: 'identified' } },
  { name: 'generic Chromium and GREASE do not prove Chrome', input: { userAgent: '', userAgentData: { brands: [{ brand: 'Chromium', version: '130' }, { brand: 'Not_A Brand', version: '99' }] } }, expected: {} },
  { name: 'unknown hint brand cannot match inherited object properties', input: { userAgent: '', userAgentData: { brands: [{ brand: 'constructor', version: '1' }] } }, expected: {} },
  { name: 'generic hints do not erase explicit UA', input: { userAgent: chrome, userAgentData: { brands: [{ brand: 'Chromium', version: '130' }] } }, expected: { browser: 'chrome', platform: 'android', mobile: true, confidence: 'identified' } },
  { name: 'contradicting specific UA and hints', input: { userAgent: `${chrome} EdgA/130.0`, userAgentData: { brands: [{ brand: 'Google Chrome', version: '130' }] } }, expected: { platform: 'android', mobile: true } },
  { name: 'contradicting hint brands', input: { userAgent: chrome, userAgentData: { brands: [{ brand: 'Google Chrome', version: '130' }, { brand: 'Microsoft Edge', version: '130' }] } }, expected: { platform: 'android', mobile: true } },
  { name: 'contradicting platforms', input: { userAgent: `${iphone} CriOS/130.0`, userAgentData: { platform: 'Android' } }, expected: { platform: 'ios', mobile: true } },
  { name: 'standalone preserves identified browser', input: { userAgent: chrome, standalone: true }, expected: { browser: 'chrome', platform: 'android', mobile: true, standalone: true, confidence: 'identified' } },
]

describe('detectBookmarkBrowser', () => {
  test.each(fixtures)('$name', ({ input, expected }) => {
    expect(detectBookmarkBrowser(input)).toEqual({ ...defaults, ...expected })
  })

  test('imports and runs without browser globals', () => {
    expect(typeof window).toBe('undefined')
    expect(detectBookmarkBrowser({ userAgent: '' })).toEqual(defaults)
  })
})
