import { LocalizedText } from './types'

const DEFAULT_LOCALE = 'de'

export function t(str: LocalizedText | null | undefined, locale: string = DEFAULT_LOCALE): string {
  if (!str) return ''
  return str[locale] || str.de || Object.values(str).find(Boolean) || ''
}
