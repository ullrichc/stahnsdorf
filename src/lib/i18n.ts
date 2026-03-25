import { Translation } from './types'

const DEFAULT_LOCALE = 'de'

export function t(str: Translation, locale: string = DEFAULT_LOCALE): string {
  return str[locale] || str.de || ''
}
