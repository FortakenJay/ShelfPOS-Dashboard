import { createFileRoute } from '@tanstack/react-router'
import { createSupabaseAdmin } from '#/lib/server/supabase-admin'
import { updateStoreBilling } from '#/lib/server/operator-stores'
import { operatorInviteConfigured } from '#/lib/server-env'
import { verifySuperadminFromRequest } from '#/lib/server/verify-superadmin'

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

export const Route = createFileRoute('/api/operator/stores/$storeId/billing')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        if (!operatorInviteConfigured()) {
          return json({ error: 'secret_key_not_configured' }, 503)
        }

        const auth = await verifySuperadminFromRequest(request)
        if (!auth.ok) {
          return json({ error: auth.message }, auth.status)
        }

        const admin = createSupabaseAdmin()
        if (!admin) {
          return json({ error: 'secret_key_not_configured' }, 503)
        }

        const storeId = params.storeId.trim()
        if (!storeId) {
          return json({ error: 'invalid_input' }, 400)
        }

        let body: {
          billingEmail?: string
          billingInterval?: string | null
          nextPaymentAt?: string | null
          markPaid?: boolean
        }
        try {
          body = (await request.json()) as typeof body
        } catch {
          return json({ error: 'invalid_input' }, 400)
        }

        try {
          const store = await updateStoreBilling(admin, storeId, body)
          return json({ store })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'billing_update_failed'
          if (msg === 'store_not_found') return json({ error: 'store_not_found' }, 404)
          if (msg === 'invalid_interval' || msg === 'invalid_date') {
            return json({ error: 'invalid_input' }, 400)
          }
          if (msg === 'billing_interval_required') {
            return json({ error: 'billing_interval_required' }, 400)
          }
          return json({ error: 'billing_update_failed' }, 500)
        }
      },
    },
  },
})
