import { describe, expect, it } from 'vitest'
import { feedbackFormUrl } from './feedback'

describe('feedbackFormUrl', () => {
  it('returns the general feedback form without a prefilled POI', () => {
    const url = new URL(feedbackFormUrl())

    expect(url.origin + url.pathname).toBe(
      'https://docs.google.com/forms/d/e/1FAIpQLSdPcLVP2DtD4wFdYzI_0VVXzfe96EJG9iEV1CI4RBWSUplicg/viewform',
    )
    expect(url.searchParams.get('usp')).toBe('pp_url')
    expect(url.searchParams.has('entry.1086728398')).toBe(false)
  })

  it('prefills the displayed POI name without damaging special characters', () => {
    const url = new URL(feedbackFormUrl('Erik Jan Hanussen & Steinschneider'))

    expect(url.searchParams.get('entry.1086728398')).toBe('Erik Jan Hanussen & Steinschneider')
  })
})
