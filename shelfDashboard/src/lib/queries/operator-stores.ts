import type { BillingInterval } from '#/lib/billing'

export interface OperatorStoreRow {
  storeId: string
  label: string
  ownerEmail: string | null
  billingEmail: string | null
  billingInterval: BillingInterval | string | null
  nextPaymentAt: string | null
  billingPaid: boolean
  posLastSeenAt: string | null
}

export type OperatorStoresErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'secret_key_not_configured'
  | 'stores_load_failed'
  | 'store_not_found'
  | 'invalid_input'
  | 'billing_interval_required'
  | 'billing_update_failed'

export class OperatorStoresError extends Error {
  constructor(readonly code: OperatorStoresErrorCode) {
    super(code)
    this.name = 'OperatorStoresError'
  }
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchOperatorStores(accessToken: string): Promise<OperatorStoreRow[]> {
  const res = await fetch('/api/operator/stores', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const payload = (await parseJson(res)) as
    | { stores?: OperatorStoreRow[] }
    | { error?: OperatorStoresErrorCode }
    | null

  if (!res.ok) {
    const code = payload && 'error' in payload ? payload.error : 'stores_load_failed'
    throw new OperatorStoresError(code ?? 'stores_load_failed')
  }

  return payload && 'stores' in payload && payload.stores ? payload.stores : []
}

export interface UpdateStoreBillingPayload {
  billingEmail?: string
  billingInterval?: BillingInterval | null
  nextPaymentAt?: string | null
  markPaid?: boolean
}

export async function updateOperatorStoreBilling(
  accessToken: string,
  storeId: string,
  body: UpdateStoreBillingPayload,
): Promise<OperatorStoreRow> {
  const res = await fetch(`/api/operator/stores/${encodeURIComponent(storeId)}/billing`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  const payload = (await parseJson(res)) as
    | { store?: OperatorStoreRow }
    | { error?: OperatorStoresErrorCode }
    | null

  if (!res.ok) {
    const code = payload && 'error' in payload ? payload.error : 'billing_update_failed'
    throw new OperatorStoresError(code ?? 'billing_update_failed')
  }

  if (!payload || !('store' in payload) || !payload.store) {
    throw new OperatorStoresError('billing_update_failed')
  }

  return payload.store
}
