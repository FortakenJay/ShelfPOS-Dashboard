const PRODUCTION_ORIGIN = 'https://shelfpos.net'

/** Canonical dashboard origin for auth redirects and shareable signup links. */
export function getDashboardPublicOrigin(): string {
  const fromEnv = import.meta.env.VITE_DASHBOARD_URL as string | undefined
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/$/, '')

  if (typeof window !== 'undefined') {
    const { origin, hostname } = window.location
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return origin.replace(/\/$/, '')
    }
  }

  return PRODUCTION_ORIGIN
}
