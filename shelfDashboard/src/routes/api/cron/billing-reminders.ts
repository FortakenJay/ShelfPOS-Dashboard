import { createFileRoute } from '@tanstack/react-router'
import { createSupabaseAdmin } from '#/lib/server/supabase-admin'
import { runBillingReminders } from '#/lib/server/billing-reminders'
import {
  billingRemindersConfigured,
  getBillingCronSecret,
  getDiscordBillingWebhookUrl,
} from '#/lib/server-env'

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

function authorizeCron(request: Request): boolean {
  const secret = getBillingCronSecret()
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  if (header === `Bearer ${secret}`) return true
  const cronHeader = request.headers.get('x-cron-secret') ?? ''
  return cronHeader === secret
}

export const Route = createFileRoute('/api/cron/billing-reminders')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorizeCron(request)) {
          return json({ error: 'unauthorized' }, 401)
        }

        if (!billingRemindersConfigured()) {
          return json({ error: 'billing_reminders_not_configured' }, 503)
        }

        const admin = createSupabaseAdmin()
        if (!admin) {
          return json({ error: 'secret_key_not_configured' }, 503)
        }

        const webhookUrl = getDiscordBillingWebhookUrl()

        try {
          const result = await runBillingReminders(admin, webhookUrl)
          return json({ ok: true, ...result })
        } catch {
          return json({ error: 'reminder_run_failed' }, 500)
        }
      },
    },
  },
})
