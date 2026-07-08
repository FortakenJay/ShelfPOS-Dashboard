const KNOWN = new Set([
  'missing_callback',
  'expired',
  'invalid',
])

type AuthCallbackErrorNamespace = 'acceptInvite' | 'resetPassword'

export function completeAuthCallbackErrorKey(
  code: string,
  namespace: AuthCallbackErrorNamespace = 'acceptInvite',
): string {
  const lower = code.toLowerCase()
  if (lower.includes('expired') || lower.includes('invalid jwt')) {
    return `${namespace}.errors.expired`
  }
  if (lower.includes('auth session missing') || lower.includes('session missing')) {
    return `${namespace}.errors.session_missing`
  }
  if (lower.includes('invalid')) {
    return `${namespace}.errors.invalid`
  }
  if (KNOWN.has(code)) {
    return `${namespace}.errors.${code}`
  }
  return `${namespace}.errors.invalid`
}
