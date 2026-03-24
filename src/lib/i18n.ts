import { LocalizedString } from './types'

const DEFAULT_LOCALE = 'de'

export function t(str: LocalizedString, locale: string = DEFAULT_LOCALE): string {
  return str[locale as keyof LocalizedString] || str.de
}
