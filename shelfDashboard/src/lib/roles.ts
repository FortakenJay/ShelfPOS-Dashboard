import type { User } from '@supabase/supabase-js'

/** Platform operator — set via Supabase auth app_metadata.role = "superadmin". */
export function isSuperadminUser(user: User | null | undefined): boolean {
  if (!user) return false
  const role = user.app_metadata.role
  return typeof role === 'string' && role.trim().toLowerCase() === 'superadmin'
}

export function postLoginPath(user: User): '/admin' | '/dashboard' {
  return isSuperadminUser(user) ? '/admin' : '/dashboard'
}
