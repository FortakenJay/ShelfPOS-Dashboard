import { getSupabase } from '#/lib/supabase'
import type { StoreId } from '#/lib/stores'

const PAGE_SIZE = 1000

/** Latest audit username per user id (sync mirror has no users table). */
export async function usernameMapForUserIds(
  storeId: StoreId,
  userIds: number[],
): Promise<Map<number, string>> {
  const unique = [...new Set(userIds)]
  if (!unique.length) return new Map()

  const map = new Map<number, string>()
  const pending = new Set(unique)
  let offset = 0

  while (pending.size > 0) {
    const { data, error } = await getSupabase()
      .from('audit_log')
      .select('user_id, username, created_at')
      .eq('store_id', storeId)
      .in('user_id', unique)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error
    if (!data.length) break

    for (const row of data) {
      const id = row.user_id as number
      const username = (row.username as string | null)?.trim()
      if (id && username && !map.has(id)) {
        map.set(id, username)
        pending.delete(id)
      }
    }

    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return map
}
