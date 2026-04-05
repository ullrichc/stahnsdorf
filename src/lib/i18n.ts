import { LocalizedText } from './types'

const DEFAULT_LOCALE = 'de'

export function t(str: LocalizedText, locale: string = DEFAULT_LOCALE): string {
  return str[locale] || str.de || ''
}
