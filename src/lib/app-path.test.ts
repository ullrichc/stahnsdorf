import { afterEach, describe, expect, test, vi } from 'vitest'
import { resolveAppPath, resolveAudioUrl } from './app-path'

describe('app paths', () => {
  afterEach(() => vi.unstubAllEnvs())

  test('adds the configured base path to local assets', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/stahnsdorf')
    expect(resolveAppPath('/media/audio/test.mp3')).toBe('/stahnsdorf/media/audio/test.mp3')
  })

  test('does not duplicate an existing base path', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/stahnsdorf')
    expect(resolveAppPath('/stahnsdorf/media/audio/test.mp3')).toBe('/stahnsdorf/media/audio/test.mp3')
  })

  test('preserves absolute URLs', () => {
    expect(resolveAppPath('https://example.com/audio.mp3')).toBe('https://example.com/audio.mp3')
  })

  test('maps bare audio values into the audio directory', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/stahnsdorf')
    expect(resolveAudioUrl('test.mp3')).toBe('/stahnsdorf/media/audio/test.mp3')
    expect(resolveAudioUrl('/media/audio/test.mp3')).toBe('/stahnsdorf/media/audio/test.mp3')
  })
})
