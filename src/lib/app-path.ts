export function getAppBasePath(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_PATH
    ?? (process.env.NODE_ENV === 'production' ? '/stahnsdorf' : '')
  const trimmed = configured.trim().replace(/\/$/, '')
  return trimmed && trimmed !== '/' ? (trimmed.startsWith('/') ? trimmed : `/${trimmed}`) : ''
}

export function resolveAppPath(urlOrPath: string): string {
  const value = urlOrPath.trim()
  if (/^(https?:|data:|blob:)/i.test(value)) return value

  const basePath = getAppBasePath()
  const path = value.startsWith('/') ? value : `/${value}`
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) return path
  return `${basePath}${path}`
}

export function resolveAudioUrl(src: string): string {
  const value = src.trim()
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  if (value.startsWith('/media/audio/') || value.startsWith('media/audio/')) {
    return resolveAppPath(value)
  }
  return resolveAppPath(`/media/audio/${value.replace(/^\/+/, '')}`)
}
