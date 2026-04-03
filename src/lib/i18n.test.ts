import { describe, test, expect } from 'vitest'
import { t } from './i18n'

describe('t() translation function', () => {
  test('returns the requested locale value', () => {
    expect(t({ de: 'Hallo', en: 'Hello' }, 'en')).toBe('Hello')
  })

  test('falls back to de when requested locale is missing', () => {
    expect(t({ de: 'Hallo' }, 'fr')).toBe('Hallo')
  })

  test('returns empty string when nothing is available', () => {
    expect(t({}, 'en')).toBe('')
  })

  test('defaults to de when no locale argument is given', () => {
    expect(t({ de: 'Standard', en: 'Default' })).toBe('Standard')
  })

  test('returns de even when en exists and no locale specified', () => {
    expect(t({ de: 'Deutsch', en: 'English', fr: 'Français' })).toBe('Deutsch')
  })
})
