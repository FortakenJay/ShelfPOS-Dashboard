import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseSecretKey, getSupabaseUrl } from '#/lib/server-env'

export function createSupabaseAdmin(): SupabaseClient | null {
  const url = getSupabaseUrl()
  const secretKey = getSupabaseSecretKey()
  if (!url || !secretKey) return null

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
