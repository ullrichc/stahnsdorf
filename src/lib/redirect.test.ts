import { describe, expect, test } from 'vitest'
import {
  adminPoiEditHref,
  collectionDetailHref,
  mapPoiHref,
  normalizeInternalRedirect,
  poiDetailHref,
} from './redirect'

describe('normalizeInternalRedirect', () => {
  test('keeps normal internal paths', () => {
    expect(normalizeInternalRedirect('/sammlungen')).toBe('/sammlungen')
  })

  test('converts legacy POI paths and keeps query strings', () => {
    expect(normalizeInternalRedirect('/poi/poi_sws_adolf-bastian?x=1')).toBe('/poi?id=poi_sws_adolf-bastian&x=1')
  })

  test('converts legacy admin POI paths', () => {
    expect(normalizeInternalRedirect('/admin/poi/poi_sws_adolf-bastian')).toBe('/admin/poi/edit?id=poi_sws_adolf-bastian')
  })

  test('converts legacy collection paths', () => {
    expect(normalizeInternalRedirect('/sammlung/collection_sws-kunst')).toBe('/sammlung?id=collection_sws-kunst')
  })

  test('rejects protocol-relative URLs', () => {
    expect(normalizeInternalRedirect('//example.com/path')).toBeNull()
  })

  test('rejects paths that normalize to a protocol-relative URL', () => {
    expect(normalizeInternalRedirect('/a/..//evil.com')).toBeNull()
  })

  test('rejects absolute URLs', () => {
    expect(normalizeInternalRedirect('https://example.com/path')).toBeNull()
  })

  test('rejects backslashes and control characters', () => {
    expect(normalizeInternalRedirect('/\\evil.example')).toBeNull()
    expect(normalizeInternalRedirect('/safe\npath')).toBeNull()
  })

  test('rejects empty values', () => {
    expect(normalizeInternalRedirect('')).toBeNull()
  })
})

describe('canonical POI hrefs', () => {
  test('encodes public POI ids in the query string', () => {
    expect(poiDetailHref('poi with spaces')).toBe('/poi?id=poi%20with%20spaces')
  })

  test('encodes an optional internal return context', () => {
    expect(poiDetailHref('poi_sws_test', '/sammlung?id=collection_sws_test'))
      .toBe('/poi?id=poi_sws_test&from=%2Fsammlung%3Fid%3Dcollection_sws_test')
  })

  test('encodes admin POI ids in the query string', () => {
    expect(adminPoiEditHref('poi/with/slashes')).toBe('/admin/poi/edit?id=poi%2Fwith%2Fslashes')
  })

  test('encodes collection ids in the query string', () => {
    expect(collectionDetailHref('collection with spaces')).toBe('/sammlung?id=collection%20with%20spaces')
  })

  test('encodes focused POI ids for the map', () => {
    expect(mapPoiHref('poi/with spaces')).toBe('/?poi=poi%2Fwith%20spaces')
  })
})
