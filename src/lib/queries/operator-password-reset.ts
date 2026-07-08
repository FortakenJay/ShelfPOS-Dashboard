export interface OwnerResetLinkResult {
  email: string
  actionLink: string
  expiresAt: string | null
}

export interface OwnerResetEmailResult {
  email: string
  sent: true
}

export type OperatorResetErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_input'
  | 'invalid_email'
  | 'owner_not_found'
  | 'reset_failed'
  | 'reset_link_failed'
  | 'secret_key_not_configured'
  | 'supabase_not_configured'

export class OperatorResetError extends Error {
  constructor(readonly code: OperatorResetErrorCode) {
    super(code)
    this.name = 'OperatorResetError'
  }
}

async function parseResetResponse(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function generateOwnerResetLink(
  accessToken: string,
  email: string,
): Promise<OwnerResetLinkResult> {
  const res = await fetch('/api/operator/reset-owner-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email }),
  })

  const payload = (await parseResetResponse(res)) as
    | OwnerResetLinkResult
    | { error?: OperatorResetErrorCode }
    | null

  if (!res.ok) {
    const code = payload && 'error' in payload ? payload.error : 'reset_failed'
    throw new OperatorResetError(code ?? 'reset_failed')
  }

  if (!payload || !('actionLink' in payload)) {
    throw new OperatorResetError('reset_link_failed')
  }

  return payload
}

export async function sendOwnerResetEmail(
  accessToken: string,
  email: string,
): Promise<OwnerResetEmailResult> {
  const res = await fetch('/api/operator/reset-owner-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email, sendEmail: true }),
  })

  const payload = (await parseResetResponse(res)) as
    | OwnerResetEmailResult
    | { error?: OperatorResetErrorCode }
    | null

  if (!res.ok) {
    const code = payload && 'error' in payload ? payload.error : 'reset_failed'
    throw new OperatorResetError(code ?? 'reset_failed')
  }

  if (!payload || !('sent' in payload)) {
    throw new OperatorResetError('reset_failed')
  }

  return payload
}
