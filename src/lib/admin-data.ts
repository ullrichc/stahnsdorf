import type { Bild } from './types'

export const FIRESTORE_BATCH_WRITE_LIMIT = 500

export function normalizeImageForFirestore(image: Bild): Bild {
  const normalized = Object.fromEntries(
    Object.entries(image).filter(([, value]) => value !== undefined),
  ) as Bild

  if (!normalized.nachweis_url?.trim()) delete normalized.nachweis_url
  return normalized
}

export function assertAtomicWriteLimit(operationCount: number): void {
  if (operationCount > FIRESTORE_BATCH_WRITE_LIMIT) {
    throw new Error(`Der Vorgang benötigt ${operationCount} Schreibvorgänge. Für einen atomaren Vorgang sind maximal ${FIRESTORE_BATCH_WRITE_LIMIT} möglich.`)
  }
}
