import { describe, expect, test } from 'vitest'
import { isNavigationTabActive, shouldUseBrowserBack } from './navigation'

describe('isNavigationTabActive', () => {
  test('maps POI detail routes to the map tab', () => {
    expect(isNavigationTabActive('/poi', '/')).toBe(true)
    expect(isNavigationTabActive('/poi/poi_sws_test', '/')).toBe(true)
  })

  test('maps collection detail routes to the collections tab', () => {
    expect(isNavigationTabActive('/sammlung', '/sammlungen')).toBe(true)
    expect(isNavigationTabActive('/sammlung/collection_sws_test', '/sammlungen')).toBe(true)
  })

  test('does not activate unrelated tabs', () => {
    expect(isNavigationTabActive('/info', '/')).toBe(false)
    expect(isNavigationTabActive('/einstellungen', '/sammlungen')).toBe(false)
  })
})

describe('shouldUseBrowserBack', () => {
  test('uses history only for a same-origin referrer', () => {
    expect(shouldUseBrowserBack('https://example.test/sammlungen', 'https://example.test', 3)).toBe(true)
    expect(shouldUseBrowserBack('https://external.test/start', 'https://example.test', 3)).toBe(false)
  })

  test('falls back when there is no usable previous entry', () => {
    expect(shouldUseBrowserBack('', 'https://example.test', 3)).toBe(false)
    expect(shouldUseBrowserBack('https://example.test/', 'https://example.test', 1)).toBe(false)
  })
})
