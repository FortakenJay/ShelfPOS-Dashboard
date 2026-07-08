export interface OwnerInviteLinkResult {
  email: string
  actionLink: string
  expiresAt: string | null
}

export interface OwnerInviteEmailResult {
  email: string
  sent: boolean
  emailFailed?: boolean
  actionLink?: string
  expiresAt?: string | null
}

export type OperatorInviteErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_input'
  | 'invalid_email'
  | 'owner_already_exists'
  | 'invite_failed'
  | 'invite_link_failed'
  | 'redirect_not_allowed'
  | 'secret_key_invalid'
  | 'invite_email_failed'
  | 'secret_key_not_configured'
  | 'supabase_not_configured'

export class OperatorInviteError extends Error {
  constructor(readonly code: OperatorInviteErrorCode) {
    super(code)
    this.name = 'OperatorInviteError'
  }
}

async function parseInviteResponse(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function generateOwnerInviteLink(
  accessToken: string,
  email: string,
): Promise<OwnerInviteLinkResult> {
  const res = await fetch('/api/operator/invite-owner', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email }),
  })

  const payload = (await parseInviteResponse(res)) as
    | OwnerInviteLinkResult
    | { error?: OperatorInviteErrorCode }
    | null

  if (!res.ok) {
    const code = payload && 'error' in payload ? payload.error : 'invite_failed'
    throw new OperatorInviteError(code ?? 'invite_failed')
  }

  if (!payload || !('actionLink' in payload)) {
    throw new OperatorInviteError('invite_link_failed')
  }

  return payload
}

export async function sendOwnerInviteEmail(
  accessToken: string,
  email: string,
): Promise<OwnerInviteEmailResult> {
  const res = await fetch('/api/operator/invite-owner', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email, sendEmail: true }),
  })

  const payload = (await parseInviteResponse(res)) as
    | OwnerInviteEmailResult
    | { error?: OperatorInviteErrorCode }
    | null

  if (!res.ok) {
    const code = payload && 'error' in payload ? payload.error : 'invite_failed'
    throw new OperatorInviteError(code ?? 'invite_failed')
  }

  if (!payload || !('email' in payload)) {
    throw new OperatorInviteError('invite_failed')
  }

  return payload
}
