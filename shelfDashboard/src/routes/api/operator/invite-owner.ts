import { createFileRoute } from '@tanstack/react-router'
import { createSupabaseAdmin } from '#/lib/server/supabase-admin'
import {
  isValidEmail,
  normalizeEmail,
  resolveDashboardRedirect,
} from '#/lib/server/operator-auth-api'
import {
  formatSupabaseAuthError,
  isSupabaseEmailDeliveryError,
  mapSupabaseInviteError,
} from '#/lib/server/supabase-auth-error'
import { operatorInviteConfigured } from '#/lib/server-env'
import { verifySuperadminFromRequest } from '#/lib/server/verify-superadmin'

interface InviteBody {
  email?: string
  sendEmail?: boolean
  redirectOrigin?: string
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

function hasLocalhostRedirect(actionLink: string): boolean {
  try {
    const parsed = new URL(actionLink)
    const redirectTo = parsed.searchParams.get('redirect_to') ?? ''
    if (!redirectTo) return false
    const redirectUrl = new URL(redirectTo)
    return redirectUrl.hostname === 'localhost' || redirectUrl.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

async function generateInviteLink(
  admin: NonNullable<ReturnType<typeof createSupabaseAdmin>>,
  email: string,
  redirectTo: string,
): Promise<
  | { ok: true; actionLink: string; expiresAt: string | null }
  | { ok: false; error: string }
> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo },
  })

  if (error) {
    console.error('[invite-owner] generateLink:', formatSupabaseAuthError(error))
    return { ok: false, error: mapSupabaseInviteError(error) }
  }

  const actionLink = data.properties.action_link
  if (!actionLink) {
    return { ok: false, error: 'invite_link_failed' }
  }
  if (hasLocalhostRedirect(actionLink)) {
    console.error('[invite-owner] generated localhost redirect, refusing link:', actionLink)
    return { ok: false, error: 'redirect_not_allowed' }
  }

  return {
    ok: true,
    actionLink,
    expiresAt: data.properties.expires_at ?? null,
  }
}

export const Route = createFileRoute('/api/operator/invite-owner')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!operatorInviteConfigured()) {
          return json({ error: 'secret_key_not_configured' }, 503)
        }

        const auth = await verifySuperadminFromRequest(request)
        if (!auth.ok) {
          return json({ error: auth.message }, auth.status)
        }

        let body: InviteBody
        try {
          body = (await request.json()) as InviteBody
        } catch {
          return json({ error: 'invalid_input' }, 400)
        }

        const email = normalizeEmail(body.email ?? '')
        if (!isValidEmail(email)) {
          return json({ error: 'invalid_email' }, 400)
        }

        const admin = createSupabaseAdmin()
        if (!admin) {
          return json({ error: 'secret_key_not_configured' }, 503)
        }

        const redirectTo = resolveDashboardRedirect('/accept-invite', body.redirectOrigin, request)
        console.info('[invite-owner] redirectTo:', redirectTo)
        const preview = await generateInviteLink(admin, email, redirectTo)
        if (!preview.ok) {
          return json({ error: preview.error }, 400)
        }

        if (body.sendEmail) {
          const { error } = await admin.auth.admin.inviteUserByEmail(email, {
            redirectTo,
          })
          if (!error) {
            return json({ email, sent: true })
          }

          console.error('[invite-owner] inviteUserByEmail:', formatSupabaseAuthError(error))
          const mapped = mapSupabaseInviteError(error)

          if (mapped !== 'owner_already_exists' && isSupabaseEmailDeliveryError(error)) {
            return json({
              email,
              sent: false,
              emailFailed: true,
              actionLink: preview.actionLink,
              expiresAt: preview.expiresAt,
            })
          }

          return json({ error: mapped }, 400)
        }

        return json({
          email,
          actionLink: preview.actionLink,
          expiresAt: preview.expiresAt,
        })
      },
    },
  },
})
