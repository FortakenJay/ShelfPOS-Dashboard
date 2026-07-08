import { createFileRoute } from '@tanstack/react-router'
import { createSupabaseAdmin } from '#/lib/server/supabase-admin'
import { listOperatorStores } from '#/lib/server/operator-stores'
import { operatorInviteConfigured } from '#/lib/server-env'
import { verifySuperadminFromRequest } from '#/lib/server/verify-superadmin'

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

export const Route = createFileRoute('/api/operator/stores')({
  server: {
    handlers: {
      GET: async ({ request }) => {
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

        try {
          const stores = await listOperatorStores(admin)
          return json({ stores })
        } catch {
          return json({ error: 'stores_load_failed' }, 500)
        }
      },
    },
  },
})
