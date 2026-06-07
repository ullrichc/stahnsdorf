import { describe, expect, test } from 'vitest'
import { normalizeInternalRedirect } from './redirect'

describe('normalizeInternalRedirect', () => {
  test('keeps normal internal paths', () => {
    expect(normalizeInternalRedirect('/sammlungen')).toBe('/sammlungen')
  })

  test('keeps internal paths with query strings', () => {
    expect(normalizeInternalRedirect('/poi/poi_sws_adolf-bastian?x=1')).toBe('/poi/poi_sws_adolf-bastian?x=1')
  })

  test('rejects protocol-relative URLs', () => {
    expect(normalizeInternalRedirect('//example.com/path')).toBeNull()
  })

  test('rejects absolute URLs', () => {
    expect(normalizeInternalRedirect('https://example.com/path')).toBeNull()
  })

  test('rejects empty values', () => {
    expect(normalizeInternalRedirect('')).toBeNull()
  })
})
