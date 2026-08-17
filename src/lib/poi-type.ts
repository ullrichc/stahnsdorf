import type { UIDictionary } from './ui-dictionary'

const typeDictionaryKeys = {
  grab: 'typeGrab',
  bauwerk: 'typeBauwerk',
  entrance: 'typeBauwerk',
  bereich: 'typeBereich',
  denkmal: 'typeDenkmal',
  mausoleum: 'typeMausoleum',
  gedenkanlage: 'typeGedenkanlage',
} as const satisfies Record<string, keyof UIDictionary>

export function getPoiTypeLabel(typ: string, dictionary: UIDictionary): string {
  const key = typeDictionaryKeys[typ as keyof typeof typeDictionaryKeys]
  return key ? dictionary[key] : typ
}
