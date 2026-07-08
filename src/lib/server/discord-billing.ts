import { toUtcDateKey } from '#/lib/billing'

export type BillingReminderKind = 'week_before' | 'due_today'

export interface BillingReminderPayload {
  storeId: string
  storeLabel: string
  email: string
  nextPaymentAt: string
  kind: BillingReminderKind
}

export async function sendBillingDiscordReminder(
  webhookUrl: string,
  payload: BillingReminderPayload,
): Promise<void> {
  const dueLabel = new Date(payload.nextPaymentAt).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  const bodyLine =
    payload.kind === 'week_before'
      ? `El usuario **${payload.email}** no ha pagado. La fecha de cobro es **${dueLabel}** (faltan 7 días).`
      : `El usuario **${payload.email}** no ha pagado. **Hoy** es su fecha de cobro (**${dueLabel}**).`

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: '@here',
      allowed_mentions: { parse: ['here'] },
      embeds: [
        {
          title: 'ShelfPOS — cobro pendiente',
          description: bodyLine,
          color: 0xe11d48,
          fields: [
            { name: 'Tienda', value: payload.storeLabel, inline: true },
            { name: 'Store ID', value: payload.storeId, inline: true },
            { name: 'Vence (UTC)', value: toUtcDateKey(payload.nextPaymentAt), inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Discord webhook failed: ${res.status} ${text}`)
  }
}
