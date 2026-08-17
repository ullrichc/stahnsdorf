import { describe, expect, test } from 'vitest'
import type { UIDictionary } from './ui-dictionary'
import { getPoiTypeLabel } from './poi-type'

const dictionary = {
  typeGrab: 'Grabstätte',
  typeBauwerk: 'Bauwerk',
  typeBereich: 'Bereich',
  typeDenkmal: 'Denkmal',
  typeMausoleum: 'Mausoleum',
  typeGedenkanlage: 'Gedenkanlage',
} as UIDictionary

describe('getPoiTypeLabel', () => {
  test('maps every schema type through the UI dictionary', () => {
    expect(getPoiTypeLabel('grab', dictionary)).toBe('Grabstätte')
    expect(getPoiTypeLabel('bauwerk', dictionary)).toBe('Bauwerk')
    expect(getPoiTypeLabel('bereich', dictionary)).toBe('Bereich')
    expect(getPoiTypeLabel('denkmal', dictionary)).toBe('Denkmal')
    expect(getPoiTypeLabel('mausoleum', dictionary)).toBe('Mausoleum')
    expect(getPoiTypeLabel('gedenkanlage', dictionary)).toBe('Gedenkanlage')
  })

  test('keeps unexpected legacy values visible for diagnosis', () => {
    expect(getPoiTypeLabel('legacy', dictionary)).toBe('legacy')
  })

  test('renders the known legacy entrance type as a building until Firestore is updated', () => {
    expect(getPoiTypeLabel('entrance', dictionary)).toBe('Bauwerk')
  })
})
