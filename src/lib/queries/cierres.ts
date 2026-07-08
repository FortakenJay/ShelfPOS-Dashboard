import { getSupabase } from '#/lib/supabase'
import type { StoreId } from '#/lib/stores'
import type { CierreRow } from '#/lib/types'

export interface CierresOptions {
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export interface CierresPage {
  rows: CierreRow[]
  total: number
  limit: number
  offset: number
  hasExactTotal: boolean
}

export async function fetchCierres(
  storeId: StoreId,
  options?: CierresOptions,
): Promise<CierresPage> {
  const limit = Math.min(Math.max(options?.limit ?? 200, 1), 501)
  const offset = Math.max(options?.offset ?? 0, 0)
  let query = getSupabase()
    .from('cierres')
    .select(
      `id, store_id, opened_at, closed_at, closed_by_username, shift_label,
       total_cash, total_card, total_sinpe, total_sales, cash_difference, notes`,
      { count: 'exact' },
    )
    .eq('store_id', storeId)
    .order('closed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.from) query = query.gte('closed_at', options.from)
  if (options?.to) query = query.lte('closed_at', options.to)

  const { data, error, count } = await query
  if (error) throw error
  return {
    rows: data,
    total: count ?? data.length,
    limit,
    offset,
    hasExactTotal: count != null,
  }
}
