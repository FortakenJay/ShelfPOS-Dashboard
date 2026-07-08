import { getSupabase } from '#/lib/supabase'
import type { StoreInfo } from '#/lib/stores'

/** Stores this auth user may access (RLS on public.stores). */
export async function fetchStores(): Promise<StoreInfo[]> {
  const { data, error } = await getSupabase()
    .from('stores')
    .select('store_id, display_name')
    .order('display_name', { ascending: true })

  if (error) throw error

  const stores: StoreInfo[] = []
  for (const row of data) {
    const storeId = String(row.store_id ?? '').trim()
    if (!storeId) continue
    const name = (row.display_name as string | null)?.trim()
    stores.push({ storeId, label: name || storeId })
  }
  return stores
}
