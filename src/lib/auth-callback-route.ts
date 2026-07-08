import { hasAuthCallbackInUrl } from '#/lib/complete-auth-callback'

export type AuthCallbackRoute = '/accept-invite' | '/reset-password'

/** Route that should handle the current Supabase auth callback (hash or query). */
export function getAuthCallbackRoute(): AuthCallbackRoute | null {
  if (typeof window === 'undefined' || !hasAuthCallbackInUrl()) return null

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(window.location.search)
  const type = hashParams.get('type') ?? searchParams.get('type')

  if (type === 'recovery') return '/reset-password'
  if (type === 'invite' || type === 'signup') return '/accept-invite'
  if (window.location.hash.includes('access_token')) return '/accept-invite'
  if (searchParams.get('code')) return '/accept-invite'
  return null
}

export function redirectAuthCallbackToRoute(): boolean {
  const target = getAuthCallbackRoute()
  if (!target || window.location.pathname === target) return false
  window.location.replace(`${target}${window.location.search}${window.location.hash}`)
  return true
}
