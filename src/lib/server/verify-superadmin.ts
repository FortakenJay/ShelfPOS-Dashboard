import { createClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '#/lib/server-env'

export async function verifySuperadminFromRequest(
  request: Request,
): Promise<{ ok: true; userId: string } | { ok: false; status: number; message: string }> {
  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()
  if (!url || !anonKey) {
    return { ok: false, status: 503, message: 'supabase_not_configured' }
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : ''
  if (!token) {
    return { ok: false, status: 401, message: 'unauthorized' }
  }

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await authClient.auth.getUser(token)
  if (error) {
    return { ok: false, status: 401, message: 'unauthorized' }
  }

  const role = data.user.app_metadata.role
  if (typeof role !== 'string' || role.trim().toLowerCase() !== 'superadmin') {
    return { ok: false, status: 403, message: 'forbidden' }
  }

  return { ok: true, userId: data.user.id }
}
