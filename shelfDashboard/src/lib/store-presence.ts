import type { StorePresence } from '#/lib/types'

export function findPresence(
  presences: StorePresence[],
  storeId: string,
): StorePresence | undefined {
  return presences.find((p) => p.storeId === storeId)
}
