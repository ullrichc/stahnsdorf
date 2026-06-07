const UMLAUTS: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
}

export function slugifyKennung(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => UMLAUTS[char] ?? char)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function makePOIId(name: string): string {
  return `poi_sws_${slugifyKennung(name)}`
}

export function makeCollectionId(name: string): string {
  return `collection_sws_${slugifyKennung(name)}`
}
