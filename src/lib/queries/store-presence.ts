import { parseDbTimestamp } from '#/lib/dates'
import { getSupabase } from '#/lib/supabase'
import { POS_ONLINE_THRESHOLD_MS } from '#/lib/stores'
import type { StoreInfo } from '#/lib/stores'
import type { StorePresence } from '#/lib/types'

function isRecent(
  ts: string | null | undefined,
  now: number,
  thresholdMs: number,
): boolean {
  if (!ts) return false
  const t = parseDbTimestamp(ts)
  if (Number.isNaN(t)) return false
  const age = now - t
  return age >= -60_000 && age < thresholdMs
}

/** One Supabase round-trip for all store heartbeats (not N+1). */
export async function fetchStorePresence(
  stores: StoreInfo[],
): Promise<StorePresence[]> {
  if (!stores.length) return []

  const now = Date.now()
  const ids = stores.map((s) => s.storeId)

  const { data, error } = await getSupabase()
    .from('stores')
    .select('store_id, pos_last_seen_at')
    .in('store_id', ids)

  const heartbeatById = new Map<string, string | null>()
  if (!error) {
    for (const row of data) {
      heartbeatById.set(row.store_id, row.pos_last_seen_at ?? null)
    }
  }

  return stores.map(({ storeId, label }) => {
    const posTs = heartbeatById.get(storeId) ?? null
    const online =
      posTs !== null && isRecent(posTs, now, POS_ONLINE_THRESHOLD_MS)

    return {
      storeId,
      label,
      lastSeenAt: posTs,
      online,
    }
  })
}
