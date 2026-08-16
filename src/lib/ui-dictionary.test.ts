import { describe, expect, test } from 'vitest'
import { ui } from './ui-dictionary'

describe('visitor fallback translations', () => {
  test('provides not-found body and redirect message in every supported locale', () => {
    for (const dictionary of Object.values(ui)) {
      expect(dictionary.pageNotFoundBody).toBeTruthy()
      expect(dictionary.redirecting).toBeTruthy()
    }
  })
})
