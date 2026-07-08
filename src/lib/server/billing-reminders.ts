import type { SupabaseClient } from '@supabase/supabase-js'
import { addBillingInterval, isBillingInterval, toUtcDateKey } from '#/lib/billing'
import { sendBillingDiscordReminder } from '#/lib/server/discord-billing'

interface StoreBillingRow {
  store_id: string
  display_name: string
  billing_email: string | null
  billing_interval: string | null
  next_payment_at: string | null
  billing_paid: boolean
  billing_reminder_week_for: string | null
  billing_reminder_due_for: string | null
}

export interface BillingReminderRunResult {
  checked: number
  weekReminders: number
  dueReminders: number
  skipped: number
}

function todayUtcKey(): string {
  return toUtcDateKey(new Date())
}

function addDaysUtc(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return toUtcDateKey(d)
}

export async function runBillingReminders(
  admin: SupabaseClient,
  webhookUrl: string,
): Promise<BillingReminderRunResult> {
  const today = todayUtcKey()
  const weekAhead = addDaysUtc(today, 7)

  const { data, error } = await admin
    .from('stores')
    .select(
      'store_id, display_name, billing_email, billing_interval, next_payment_at, billing_paid, billing_reminder_week_for, billing_reminder_due_for',
    )
    .eq('billing_paid', false)
    .not('next_payment_at', 'is', null)
    .not('billing_interval', 'is', null)

  if (error) throw error

  const rows = data as StoreBillingRow[]
  let weekReminders = 0
  let dueReminders = 0
  let skipped = 0

  const reminderTasks: Promise<void>[] = []

  for (const row of rows) {
    if (!row.next_payment_at || !row.billing_interval || !isBillingInterval(row.billing_interval)) {
      skipped += 1
      continue
    }

    const dueKey = toUtcDateKey(row.next_payment_at)
    const email = row.billing_email?.trim() || 'sin correo'
    const base = {
      storeId: row.store_id,
      storeLabel: row.display_name,
      email,
      nextPaymentAt: row.next_payment_at,
    }

    if (dueKey === weekAhead && row.billing_reminder_week_for !== dueKey) {
      weekReminders += 1
      reminderTasks.push(
        (async () => {
          await sendBillingDiscordReminder(webhookUrl, { ...base, kind: 'week_before' })
          await admin
            .from('stores')
            .update({ billing_reminder_week_for: dueKey })
            .eq('store_id', row.store_id)
        })(),
      )
      continue
    }

    if (dueKey === today && row.billing_reminder_due_for !== dueKey) {
      dueReminders += 1
      reminderTasks.push(
        (async () => {
          await sendBillingDiscordReminder(webhookUrl, { ...base, kind: 'due_today' })
          await admin
            .from('stores')
            .update({ billing_reminder_due_for: dueKey })
            .eq('store_id', row.store_id)
        })(),
      )
      continue
    }

    skipped += 1
  }

  await Promise.all(reminderTasks)

  return { checked: rows.length, weekReminders, dueReminders, skipped }
}

export async function markStorePaid(
  admin: SupabaseClient,
  storeId: string,
): Promise<{ nextPaymentAt: string | null }> {
  const { data: row, error } = await admin
    .from('stores')
    .select('billing_interval, next_payment_at')
    .eq('store_id', storeId)
    .maybeSingle()

  if (error) throw error
  if (!row) throw new Error('store_not_found')

  const interval = row.billing_interval
  if (!interval || !isBillingInterval(interval)) {
    throw new Error('billing_interval_required')
  }

  const now = new Date()
  const due = row.next_payment_at ? new Date(row.next_payment_at) : now
  // Advance from the scheduled due date so marking paid does not leave next due
  // exactly 7 days out on the same day (which re-triggers week-before reminders).
  let next = addBillingInterval(due, interval)
  while (next.getTime() <= now.getTime()) {
    next = addBillingInterval(next, interval)
  }

  const { error: updateError } = await admin
    .from('stores')
    .update({
      billing_paid: true,
      next_payment_at: next.toISOString(),
      billing_reminder_week_for: null,
      billing_reminder_due_for: null,
    })
    .eq('store_id', storeId)

  if (updateError) throw updateError

  return { nextPaymentAt: next.toISOString() }
}
