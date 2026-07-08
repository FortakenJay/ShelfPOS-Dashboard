import type { SupabaseClient } from '@supabase/supabase-js'
import { isBillingInterval } from '#/lib/billing'
import { markStorePaid } from '#/lib/server/billing-reminders'

export interface OperatorStoreRow {
  storeId: string
  label: string
  ownerEmail: string | null
  billingEmail: string | null
  billingInterval: string | null
  nextPaymentAt: string | null
  billingPaid: boolean
  posLastSeenAt: string | null
}

interface StoreDbRow {
  store_id: string
  display_name: string
  billing_email: string | null
  billing_interval: string | null
  next_payment_at: string | null
  billing_paid: boolean
  pos_last_seen_at: string | null
}

interface AccessRow {
  store_id: string
  user_id: string
}

export async function listOperatorStores(admin: SupabaseClient): Promise<OperatorStoreRow[]> {
  const { data: storeRows, error: storesError } = await admin
    .from('stores')
    .select(
      'store_id, display_name, billing_email, billing_interval, next_payment_at, billing_paid, pos_last_seen_at',
    )
    .order('display_name', { ascending: true })

  if (storesError) throw storesError

  const { data: accessRows, error: accessError } = await admin
    .from('store_access')
    .select('store_id, user_id')
    .eq('role', 'owner')

  if (accessError) throw accessError

  const ownerByStore = new Map<string, string>()
  for (const row of accessRows as AccessRow[]) {
    if (!ownerByStore.has(row.store_id)) {
      ownerByStore.set(row.store_id, row.user_id)
    }
  }

  const userIds = [...new Set(ownerByStore.values())]
  const emailByUserId = new Map<string, string>()
  await Promise.all(
    userIds.map(async (userId) => {
      const { data, error } = await admin.auth.admin.getUserById(userId)
      if (!error && data.user.email) {
        emailByUserId.set(userId, data.user.email)
      }
    }),
  )

  return (storeRows as StoreDbRow[]).map((row) => {
    const ownerId = ownerByStore.get(row.store_id)
    const authEmail = ownerId ? (emailByUserId.get(ownerId) ?? null) : null
    return {
      storeId: row.store_id,
      label: row.display_name,
      ownerEmail: authEmail,
      billingEmail: row.billing_email ?? authEmail,
      billingInterval: row.billing_interval,
      nextPaymentAt: row.next_payment_at,
      billingPaid: row.billing_paid,
      posLastSeenAt: row.pos_last_seen_at,
    }
  })
}

export interface UpdateStoreBillingInput {
  billingEmail?: string
  billingInterval?: string | null
  nextPaymentAt?: string | null
  markPaid?: boolean
}

export async function updateStoreBilling(
  admin: SupabaseClient,
  storeId: string,
  input: UpdateStoreBillingInput,
): Promise<OperatorStoreRow> {
  if (input.markPaid) {
    await markStorePaid(admin, storeId)
  }

  const patch: Record<string, unknown> = {}

  if (input.billingEmail !== undefined) {
    patch.billing_email = input.billingEmail.trim() || null
  }

  if (input.billingInterval !== undefined) {
    if (input.billingInterval !== null && !isBillingInterval(input.billingInterval)) {
      throw new Error('invalid_interval')
    }
    patch.billing_interval = input.billingInterval
  }

  if (input.nextPaymentAt !== undefined) {
    if (input.nextPaymentAt === null || input.nextPaymentAt === '') {
      patch.next_payment_at = null
    } else {
      const d = new Date(`${input.nextPaymentAt}T12:00:00.000Z`)
      if (Number.isNaN(d.getTime())) throw new Error('invalid_date')
      patch.next_payment_at = d.toISOString()
      patch.billing_reminder_week_for = null
      patch.billing_reminder_due_for = null
    }
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await admin.from('stores').update(patch).eq('store_id', storeId)
    if (error) throw error
  }

  const stores = await listOperatorStores(admin)
  const updated = stores.find((s) => s.storeId === storeId)
  if (!updated) throw new Error('store_not_found')
  return updated
}
