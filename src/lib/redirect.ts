export function normalizeInternalRedirect(value: string | null): string | null {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return null
  }

  const url = new URL(value, 'https://internal.invalid')
  if (url.origin !== 'https://internal.invalid' || url.pathname.startsWith('//')) return null

  const publicMatch = url.pathname.match(/^\/poi\/([^/]+)\/?$/)
  if (publicMatch) {
    return withLegacyId('/poi', decodePathSegment(publicMatch[1]), url.searchParams)
  }

  const adminMatch = url.pathname.match(/^\/admin\/poi\/([^/]+)\/?$/)
  if (adminMatch && adminMatch[1] !== 'new' && adminMatch[1] !== 'edit') {
    return withLegacyId('/admin/poi/edit', decodePathSegment(adminMatch[1]), url.searchParams)
  }

  const collectionMatch = url.pathname.match(/^\/sammlung\/([^/]+)\/?$/)
  if (collectionMatch) {
    return withLegacyId('/sammlung', decodePathSegment(collectionMatch[1]), url.searchParams)
  }

  return `${url.pathname}${url.search}${url.hash}`
}

export function poiDetailHref(id: string, returnTo?: string): string {
  const returnParam = returnTo ? `&from=${encodeURIComponent(returnTo)}` : ''
  return `/poi?id=${encodeURIComponent(id)}${returnParam}`
}

export function mapPoiHref(id: string): string {
  return `/?poi=${encodeURIComponent(id)}`
}

export function adminPoiEditHref(id: string): string {
  return `/admin/poi/edit?id=${encodeURIComponent(id)}`
}

export function collectionDetailHref(id: string): string {
  return `/sammlung?id=${encodeURIComponent(id)}`
}

function withLegacyId(path: string, id: string, existing: URLSearchParams): string {
  const params = new URLSearchParams()
  params.set('id', id)
  existing.forEach((entryValue, key) => {
    if (key !== 'id') params.append(key, entryValue)
  })
  return `${path}?${params.toString()}`
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
