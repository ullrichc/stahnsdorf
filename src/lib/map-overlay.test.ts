import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  getOverlayFeatureStyle,
  isOverlayFeatureVisible,
  mapOverlayAssetPath,
} from './map-overlay'

describe('map overlay presentation', () => {
  afterEach(() => vi.unstubAllEnvs())

  test('resolves the static GeoJSON below the production base path', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/stahnsdorf')
    expect(mapOverlayAssetPath()).toBe('/stahnsdorf/map-overlay.geojson')
  })

  test('keeps the boundary visible and reveals minor paths only when close', () => {
    expect(isOverlayFeatureVisible({ kind: 'cemetery' }, 13)).toBe(true)
    expect(isOverlayFeatureVisible({ kind: 'path', highway: 'service' }, 15)).toBe(true)
    expect(isOverlayFeatureVisible({ kind: 'path', highway: 'footway' }, 16)).toBe(false)
    expect(isOverlayFeatureVisible({ kind: 'path', highway: 'footway' }, 17)).toBe(true)
  })

  test('uses restrained distinct styles for boundary, main ways and minor paths', () => {
    expect(getOverlayFeatureStyle({ kind: 'cemetery' }, 15)).toMatchObject({
      fill: true,
      fillOpacity: 0.18,
      interactive: false,
    })
    expect(getOverlayFeatureStyle({ kind: 'path', highway: 'service' }, 17).weight ?? 0).toBeGreaterThan(
      getOverlayFeatureStyle({ kind: 'path', highway: 'footway' }, 17).weight ?? 0,
    )
  })
})
