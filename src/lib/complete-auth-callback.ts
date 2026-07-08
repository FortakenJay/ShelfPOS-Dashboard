import type { EmailOtpType, SupabaseClient } from '@supabase/supabase-js'

function parseEmailOtpType(value: string): EmailOtpType | null {
  switch (value) {
    case 'signup':
    case 'invite':
    case 'magiclink':
    case 'recovery':
    case 'email_change':
    case 'email':
      return value
    default:
      return null
  }
}

function stripAuthParamsFromUrl(): void {
  window.history.replaceState({}, '', window.location.pathname)
}

function parseHashParams(): URLSearchParams {
  return new URLSearchParams(window.location.hash.replace(/^#/, ''))
}

/** True when the URL carries Supabase auth callback params from an invite/reset link. */
export function hasAuthCallbackInUrl(): boolean {
  const params = new URLSearchParams(window.location.search)
  if (params.get('code')) return true
  if (params.get('token_hash') && params.get('type')) return true
  const hash = window.location.hash
  return hash.includes('access_token') || hash.includes('error=')
}

async function setSessionFromHash(
  sb: SupabaseClient,
): Promise<{ ok: true } | { ok: false; error: string } | null> {
  const hashParams = parseHashParams()
  const errorDesc = hashParams.get('error_description') ?? hashParams.get('error')
  if (errorDesc) return { ok: false, error: errorDesc }

  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')
  if (!accessToken || !refreshToken) return null

  const { error } = await sb.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  if (error) return { ok: false, error: error.message }
  stripAuthParamsFromUrl()
  return { ok: true }
}

export async function establishSessionFromAuthCallback(
  sb: SupabaseClient,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (error) return { ok: false, error: error.message }
    stripAuthParamsFromUrl()
    return { ok: true }
  }

  const tokenHash = params.get('token_hash')
  const type = params.get('type')
  const otpType = type ? parseEmailOtpType(type) : null
  if (tokenHash && otpType) {
    const { error } = await sb.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    })
    if (error) return { ok: false, error: error.message }
    stripAuthParamsFromUrl()
    return { ok: true }
  }

  if (window.location.hash.includes('access_token') || window.location.hash.includes('error=')) {
    const fromHash = await setSessionFromHash(sb)
    if (fromHash) return fromHash

    const { data, error } = await sb.auth.getSession()
    if (error) return { ok: false, error: error.message }
    if (data.session) {
      stripAuthParamsFromUrl()
      return { ok: true }
    }
  }

  const { data } = await sb.auth.getSession()
  if (data.session) return { ok: true }

  return { ok: false, error: 'missing_callback' }
}
