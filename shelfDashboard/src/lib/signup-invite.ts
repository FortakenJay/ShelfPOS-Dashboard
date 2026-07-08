import { getDashboardPublicOrigin } from '#/lib/dashboard-origin'

/** Secret invite key from VITE_SIGNUP_INVITE_KEY — share only via private link. */
export function signupInviteConfigured(): boolean {
  const secret = import.meta.env.VITE_SIGNUP_INVITE_KEY as string | undefined
  return Boolean(secret?.trim())
}

export function isSignupInviteValid(key: string): boolean {
  const secret = import.meta.env.VITE_SIGNUP_INVITE_KEY as string | undefined
  if (!secret?.trim()) return false
  return key.trim() === secret.trim()
}

/** Full owner signup URL for the operator portal (same secret as env invite key). */
export function buildOwnerSignupUrl(origin = getDashboardPublicOrigin()): string | null {
  const secret = import.meta.env.VITE_SIGNUP_INVITE_KEY as string | undefined
  if (!secret?.trim() || !origin.trim()) return null
  const base = origin.replace(/\/$/, '')
  return `${base}/create-account?key=${encodeURIComponent(secret.trim())}`
}
