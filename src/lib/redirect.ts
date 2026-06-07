export function normalizeInternalRedirect(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null
  }

  return value
}
