import { describe, expect, test } from 'vitest'
import { assertAtomicWriteLimit, normalizeImageForFirestore } from './admin-data'

describe('normalizeImageForFirestore', () => {
  test('removes an empty optional source URL', () => {
    const image = normalizeImageForFirestore({
      datei: 'image.jpg',
      nachweis: 'Verein',
      nachweis_url: '   ',
    })

    expect(image).not.toHaveProperty('nachweis_url')
  })

  test('removes undefined optional values without changing required data', () => {
    const image = normalizeImageForFirestore({
      datei: 'image.jpg',
      nachweis: 'Verein',
      storage_pfad: undefined,
    })

    expect(image).toEqual({ datei: 'image.jpg', nachweis: 'Verein' })
  })
})

describe('assertAtomicWriteLimit', () => {
  test('accepts exactly 500 writes', () => {
    expect(() => assertAtomicWriteLimit(500)).not.toThrow()
  })

  test('rejects imports above the Firestore batch limit', () => {
    expect(() => assertAtomicWriteLimit(501)).toThrow('Der Vorgang benötigt 501 Schreibvorgänge')
  })
})
