import { describe, test, expect } from 'vitest'
import { getDistanceMeters, formatDistance } from './geo'

describe('getDistanceMeters', () => {
  test('returns 0 for same point', () => {
    expect(getDistanceMeters(52.3906, 13.2028, 52.3906, 13.2028)).toBe(0)
  })

  test('returns approximately 560 km for Berlin to Munich', () => {
    // Berlin: 52.52, 13.405 — Munich: 48.1351, 11.582
    const distance = getDistanceMeters(52.52, 13.405, 48.1351, 11.582)
    // Known distance is roughly 504 km straight line
    expect(distance).toBeGreaterThan(500_000)
    expect(distance).toBeLessThan(510_000)
  })

  test('is symmetric — distance A→B equals B→A', () => {
    const ab = getDistanceMeters(52.3906, 13.2028, 48.1351, 11.582)
    const ba = getDistanceMeters(48.1351, 11.582, 52.3906, 13.2028)
    expect(ab).toBeCloseTo(ba, 5)
  })
})

describe('formatDistance', () => {
  test('returns "Gerade hier" for distances under 10 meters', () => {
    expect(formatDistance(0)).toBe('Gerade hier')
    expect(formatDistance(5)).toBe('Gerade hier')
    expect(formatDistance(9.9)).toBe('Gerade hier')
  })

  test('returns meters string for 10–999m', () => {
    expect(formatDistance(42)).toBe('42m')
    expect(formatDistance(500)).toBe('500m')
  })

  test('returns km string for 1000m and above', () => {
    expect(formatDistance(1500)).toBe('1.5km')
    expect(formatDistance(10000)).toBe('10.0km')
  })

  test('boundary: exactly 10m returns "10m"', () => {
    expect(formatDistance(10)).toBe('10m')
  })

  test('boundary: exactly 1000m returns "1.0km"', () => {
    expect(formatDistance(1000)).toBe('1.0km')
  })

  test('rounds meters to nearest integer', () => {
    expect(formatDistance(42.7)).toBe('43m')
    expect(formatDistance(99.4)).toBe('99m')
  })
})
