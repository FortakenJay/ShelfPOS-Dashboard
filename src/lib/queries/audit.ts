import { rangeBounds } from '#/lib/dates'
import { HIDDEN_OPERATOR_USERNAME, isHiddenOperatorUsername } from '#/lib/hidden-operator'
import { getSupabase } from '#/lib/supabase'
import { fetchAllPages } from '#/lib/supabase-page'
import type { StoreId } from '#/lib/stores'
import type { AuditRow, AuditUser, DateRange } from '#/lib/types'

export interface AuditLogOptions {
  range?: DateRange | null
  userId?: number
  action?: string
  limit?: number
  offset?: number
}

export interface AuditLogPage {
  rows: AuditRow[]
  total: number
  limit: number
  offset: number
}

export async function fetchAuditUsers(storeId: StoreId): Promise<AuditUser[]> {
  const data = await fetchAllPages(async (offset, limit) => {
    const { data: rows, error } = await getSupabase()
      .from('audit_log')
      .select('user_id, username')
      .eq('store_id', storeId)
      .not('user_id', 'is', null)
      .neq('username', HIDDEN_OPERATOR_USERNAME)
      .range(offset, offset + limit - 1)
    if (error) throw error
    return rows
  })
  const byId = new Map<number, string>()
  for (const row of data) {
    const id = row.user_id as number
    const username = (row.username as string | null)?.trim()
    if (!id || !username || isHiddenOperatorUsername(username)) continue
    byId.set(id, username)
  }
  return [...byId.entries()]
    .map(([id, username]) => ({ id, username }))
    .toSorted((a, b) => a.username.localeCompare(b.username))
}

export async function fetchAuditActions(storeId: StoreId): Promise<string[]> {
  const data = await fetchAllPages(async (offset, limit) => {
    const { data: rows, error } = await getSupabase()
      .from('audit_log')
      .select('action')
      .eq('store_id', storeId)
      .range(offset, offset + limit - 1)
    if (error) throw error
    return rows
  })
  const actions = new Set<string>()
  for (const row of data) {
    const action = (row.action as string | null)?.trim()
    if (action) actions.add(action)
  }
  return [...actions].toSorted()
}

export async function fetchAuditLog(
  storeId: StoreId,
  options?: AuditLogOptions,
): Promise<AuditLogPage> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200)
  const offset = Math.max(options?.offset ?? 0, 0)
  let query = getSupabase()
    .from('audit_log')
    .select(
      'id, store_id, user_id, username, action, entity, entity_id, detail, created_at',
      {
      count: 'exact',
    })
    .eq('store_id', storeId)
    .or(`username.is.null,username.neq.${HIDDEN_OPERATOR_USERNAME}`)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.range) {
    const bounds = rangeBounds(options.range.from, options.range.to)
    query = query.gte('created_at', bounds.from).lte('created_at', bounds.to)
  }
  if (options?.userId != null) query = query.eq('user_id', options.userId)
  if (options?.action) query = query.eq('action', options.action)

  const { data, error, count } = await query
  if (error) throw error
  return {
    rows: data,
    total: count ?? offset + data.length,
    limit,
    offset,
  }
}
