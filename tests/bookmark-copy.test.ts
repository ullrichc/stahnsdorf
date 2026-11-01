import { describe, expect, it } from 'vitest'
import type { SupportedLocale } from '../src/lib/LocaleContext'
import type { BookmarkBrowser, BookmarkPlatform } from '../src/lib/bookmark-browser'
import {
  getBookmarkCopy, getBookmarkSteps,
  getBookmarkBrowserName, getBookmarkPlatformName,
} from '../src/lib/bookmark-copy'

const locales: SupportedLocale[] = ['de', 'en', 'fr', 'pl', 'ru', 'sv']
const browsers: BookmarkBrowser[] = ['safari', 'chrome', 'firefox', 'edge', 'samsung', 'opera', 'unknown']
const platforms: BookmarkPlatform[] = ['ios', 'android', 'other']
const supported = new Set([
  'safari/ios', 'chrome/android', 'chrome/ios', 'firefox/android',
  'firefox/ios', 'samsung/android', 'edge/android', 'edge/ios', 'opera/android',
])

describe.each(locales)('bookmark copy: %s', locale => {
  it('provides every requested text and a browser-specific heading', () => {
    const copy = getBookmarkCopy(locale)
    const fields = ['title', 'body', 'howTo', 'close', 'helpLink', 'chooseOther',
      'chooseBrowser', 'choosePlatform', 'genericTitle', 'embeddedTitle',
      'browserLabel', 'platformLabel'] as const
    for (const field of fields) expect(copy[field].trim(), field).not.toBe('')
    expect(copy.helpTitle('Firefox')).toContain('Firefox')
    expect(copy.embeddedSteps.length).toBeGreaterThan(0)
    expect(copy.embeddedSteps.length).toBeLessThanOrEqual(3)
    for (const step of copy.embeddedSteps) expect(step.trim()).not.toBe('')
  })

  it('labels the action as closing, not understanding or creating a bookmark', () => {
    const expected = { de: 'Schließen', en: 'Close', fr: 'Fermer', pl: 'Zamknij', ru: 'Закрыть', sv: 'Stäng' }
    expect(getBookmarkCopy(locale).close).toBe(expected[locale])
  })

  it('provides translated browser and platform option labels', () => {
    for (const browser of browsers) expect(getBookmarkBrowserName(browser, locale).trim()).not.toBe('')
    for (const platform of platforms) expect(getBookmarkPlatformName(platform, locale).trim()).not.toBe('')
    expect(getBookmarkBrowserName('firefox', locale)).toBe('Firefox')
    expect(getBookmarkPlatformName('android', locale)).toBe('Android')
    if (locale !== 'en') {
      expect(getBookmarkBrowserName('unknown', locale)).not.toBe(getBookmarkBrowserName('unknown', 'en'))
      expect(getBookmarkPlatformName('other', locale)).not.toBe(getBookmarkPlatformName('other', 'en'))
      expect(getBookmarkCopy(locale).body).not.toBe(getBookmarkCopy('en').body)
    }
  })

  for (const browser of browsers) {
    for (const platform of platforms) {
      it(`${browser}/${platform} has at most three steps or an explicit generic fallback`, () => {
        const steps = getBookmarkSteps(browser, platform, locale)
        expect(steps.length).toBeGreaterThan(0)
        expect(steps.length).toBeLessThanOrEqual(3)
        for (const step of steps) expect(step.trim()).not.toBe('')
        if (supported.has(`${browser}/${platform}`)) {
          expect(steps).not.toEqual(getBookmarkCopy(locale).genericSteps)
          if (locale !== 'en') expect(steps).not.toEqual(getBookmarkSteps(browser, platform, 'en'))
        } else {
          expect(steps).toEqual(getBookmarkCopy(locale).genericSteps)
        }
        expect(steps.join(' ')).not.toMatch(/Home.?Screen|PWA|Leseliste|Reading List|Offline|oben rechts|unten rechts|top right|bottom right/i)
      })
    }
  }
})

it('keeps platform-specific manufacturer flows distinct', () => {
  expect(getBookmarkSteps('firefox', 'android', 'de').join(' ')).toContain('Hinzufügen')
  expect(getBookmarkSteps('firefox', 'ios', 'de').join(' ')).toContain('Sternsymbol')
  expect(getBookmarkSteps('safari', 'ios', 'de').join(' ')).toContain('Sichern')
  expect(getBookmarkSteps('edge', 'ios', 'de').join(' ')).toContain('Favoriten')
  expect(getBookmarkSteps('samsung', 'android', 'de').join(' ')).toContain('Adressleiste')
})
