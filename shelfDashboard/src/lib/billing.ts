export type BillingInterval = 'weekly' | 'monthly' | 'annual'

export const BILLING_INTERVALS: BillingInterval[] = ['weekly', 'monthly', 'annual']

export function isBillingInterval(value: string): value is BillingInterval {
  return BILLING_INTERVALS.includes(value as BillingInterval)
}

/** Advance a due date by one billing period (UTC calendar). */
export function addBillingInterval(from: Date, interval: BillingInterval): Date {
  const next = new Date(from)
  if (interval === 'weekly') {
    next.setUTCDate(next.getUTCDate() + 7)
    return next
  }
  if (interval === 'monthly') {
    next.setUTCMonth(next.getUTCMonth() + 1)
    return next
  }
  next.setUTCFullYear(next.getUTCFullYear() + 1)
  return next
}

export function toUtcDateKey(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toISOString().slice(0, 10)
}

export function parseOptionalIsoDate(raw: string | null | undefined): Date | null {
  if (!raw?.trim()) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}
