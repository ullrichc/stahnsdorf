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

export function makePOIIdCandidate(name: string, attempt: number): string {
  const base = makePOIId(name)
  return attempt <= 1 ? base : `${base}-${attempt}`
}

export function makeCollectionId(name: string): string {
  return `collection_sws_${slugifyKennung(name)}`
}

export function makeCollectionIdCandidate(name: string, attempt: number): string {
  const base = makeCollectionId(name)
  return attempt <= 1 ? base : `${base}-${attempt}`
}
