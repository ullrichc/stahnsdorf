import { describe, expect, test } from 'vitest'
import { makeCollectionId, makeCollectionIdCandidate, makePOIId, makePOIIdCandidate, slugifyKennung } from './slug'

describe('slugifyKennung', () => {
  test('transliterates German umlauts and sharp s', () => {
    expect(slugifyKennung('Müller, Größe & Öl')).toBe('mueller-groesse-oel')
  })

  test('collapses separators and trims hyphens', () => {
    expect(slugifyKennung('  Heinrich   Zille!  ')).toBe('heinrich-zille')
  })
})

test('makePOIId adds poi prefix', () => {
  expect(makePOIId('Heinrich Zille')).toBe('poi_sws_heinrich-zille')
})

test('makePOIIdCandidate adds deterministic collision suffixes', () => {
  expect(makePOIIdCandidate('Heinrich Zille', 1)).toBe('poi_sws_heinrich-zille')
  expect(makePOIIdCandidate('Heinrich Zille', 2)).toBe('poi_sws_heinrich-zille-2')
  expect(makePOIIdCandidate('Heinrich Zille', 12)).toBe('poi_sws_heinrich-zille-12')
})

test('makeCollectionId adds collection prefix', () => {
  expect(makeCollectionId('Architektur & Anlage')).toBe('collection_sws_architektur-anlage')
})

test('makeCollectionIdCandidate adds deterministic collision suffixes', () => {
  expect(makeCollectionIdCandidate('Architektur & Anlage', 1)).toBe('collection_sws_architektur-anlage')
  expect(makeCollectionIdCandidate('Architektur & Anlage', 2)).toBe('collection_sws_architektur-anlage-2')
  expect(makeCollectionIdCandidate('Architektur & Anlage', 12)).toBe('collection_sws_architektur-anlage-12')
})
