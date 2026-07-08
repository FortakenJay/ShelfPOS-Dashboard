/** Extract text from Supabase Auth errors (message is often empty or "{}"). */
export function formatSupabaseAuthError(error: {
  message?: string
  code?: string
  status?: number
  name?: string
}): string {
  const message = error.message?.trim()
  const parts = [
    error.name,
    error.code,
    error.status != null ? `status ${error.status}` : '',
    message && message !== '{}' ? message : '',
  ].filter(Boolean)
  return parts.join(' | ') || 'unknown_auth_error'
}

export function isSupabaseEmailDeliveryError(error: {
  message?: string
  code?: string
  status?: number
  name?: string
}): boolean {
  const text = formatSupabaseAuthError(error).toLowerCase()
  const message = (error.message ?? '').toLowerCase()
  if (message.includes('sending invite email') || message.includes('smtp')) return true
  if (text.includes('retryablefetch') && error.status === 500) return true
  if (error.status === 500 && (message === '{}' || !message)) return true
  return false
}

export function mapSupabaseInviteError(error: {
  message?: string
  code?: string
  status?: number
  name?: string
}): string {
  const lower = formatSupabaseAuthError(error).toLowerCase()
  const message = (error.message ?? '').toLowerCase()

  if (lower.includes('already') && (lower.includes('registered') || lower.includes('exists'))) {
    return 'owner_already_exists'
  }
  if (lower.includes('invalid') && lower.includes('email')) {
    return 'invalid_email'
  }
  if (
    lower.includes('invalid jwt') ||
    lower.includes('invalid api key') ||
    lower.includes('apikey') ||
    error.status === 401
  ) {
    return 'secret_key_invalid'
  }
  if (lower.includes('redirect') || lower.includes('url configuration')) {
    return 'redirect_not_allowed'
  }
  if (isSupabaseEmailDeliveryError(error) || lower.includes('smtp')) {
    return 'invite_email_failed'
  }
  if (message.includes('email')) {
    return 'invite_email_failed'
  }
  return 'invite_failed'
}
