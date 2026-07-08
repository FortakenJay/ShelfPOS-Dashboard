import { rangeBounds } from '#/lib/dates'
import { usernameMapForUserIds } from '#/lib/audit-usernames'
import { getSupabase } from '#/lib/supabase'
import type { StoreId } from '#/lib/stores'
import type { CashMovementRow } from '#/lib/types'

export const CASH_MOVEMENTS_PAGE_SIZE_DEFAULT = 50

export interface CashMovementsResult {
  rows: CashMovementRow[]
  total: number
  page: number
  pageSize: number
}

export async function fetchCashMovements(
  storeId: StoreId,
  from: string,
  to: string,
  options: { page: number; pageSize: number },
): Promise<CashMovementsResult> {
  const bounds = rangeBounds(from, to)
  const page = Math.max(1, options.page)
  const pageSize = Math.max(1, options.pageSize)
  const offset = (page - 1) * pageSize

  const { data, error, count } = await getSupabase()
    .from('cash_movements')
    .select('id, store_id, type, amount, reason, user_id, created_at, cierre_id', {
      count: 'exact',
    })
    .eq('store_id', storeId)
    .gte('created_at', bounds.from)
    .lte('created_at', bounds.to)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + pageSize - 1)
  if (error) throw error

  const userIds = data
    .map((row) => row.user_id as number | null)
    .filter((id): id is number => id != null)
  const usernames = await usernameMapForUserIds(storeId, userIds)

  const rows = data.map((row) => ({
    ...row,
    username:
      row.user_id != null
        ? (usernames.get(row.user_id as number) ?? `#${row.user_id}`)
        : '—',
  }))

  return {
    rows,
    total: count ?? rows.length,
    page,
    pageSize,
  }
}
