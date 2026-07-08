import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BILLING_INTERVALS } from '#/lib/billing'
import { parseDbTimestamp } from '#/lib/dates'
import type { OperatorStoreRow } from '#/lib/queries/operator-stores'
import {
  fetchOperatorStores,
  OperatorStoresError,
  updateOperatorStoreBilling,
} from '#/lib/queries/operator-stores'
import { POS_ONLINE_THRESHOLD_MS } from '#/lib/stores'
import { useToast } from '#/lib/toast'
import { Button, Input } from '#/components/ui'

function storesErrorKey(code: string): string {
  const known = [
    'unauthorized',
    'forbidden',
    'stores_load_failed',
    'store_not_found',
    'invalid_input',
    'billing_interval_required',
    'billing_update_failed',
    'secret_key_not_configured',
  ]
  return known.includes(code)
    ? `operatorPortal.storesErrors.${code}`
    : 'operatorPortal.storesErrors.billing_update_failed'
}

function isPosOnline(posLastSeenAt: string | null): boolean {
  if (!posLastSeenAt) return false
  const t = parseDbTimestamp(posLastSeenAt)
  if (Number.isNaN(t)) return false
  const age = Date.now() - t
  return age >= -60_000 && age < POS_ONLINE_THRESHOLD_MS
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

interface StoreDraft {
  billingEmail: string
  billingInterval: string
  nextPaymentAt: string
}

function draftFromStore(store: OperatorStoreRow): StoreDraft {
  return {
    billingEmail: store.billingEmail ?? store.ownerEmail ?? '',
    billingInterval: store.billingInterval ?? 'monthly',
    nextPaymentAt: toDateInputValue(store.nextPaymentAt),
  }
}

function StoreBillingRow({
  store,
  accessToken,
}: {
  store: OperatorStoreRow
  accessToken: string
}) {
  const { t } = useTranslation()
  const { show } = useToast()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<StoreDraft>(() => draftFromStore(store))

  const save = useMutation({
    mutationFn: () =>
      updateOperatorStoreBilling(accessToken, store.storeId, {
        billingEmail: draft.billingEmail.trim(),
        billingInterval: draft.billingInterval || null,
        nextPaymentAt: draft.nextPaymentAt || null,
      }),
    onSuccess: () => {
      show(t('operatorPortal.billingSaved'))
      void queryClient.invalidateQueries({ queryKey: ['operator-stores'] })
      void queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
    onError: (err) => {
      const msg =
        err instanceof OperatorStoresError
          ? t(storesErrorKey(err.code))
          : err instanceof Error
            ? err.message
            : t('operatorPortal.storesErrors.billing_update_failed')
      show(msg)
    },
  })

  const markPaid = useMutation({
    mutationFn: () =>
      updateOperatorStoreBilling(accessToken, store.storeId, {
        markPaid: true,
        billingEmail: draft.billingEmail.trim(),
        billingInterval: draft.billingInterval || null,
      }),
    onSuccess: (updated) => {
      setDraft(draftFromStore(updated))
      show(t('operatorPortal.markedPaid'))
      void queryClient.invalidateQueries({ queryKey: ['operator-stores'] })
      void queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
    onError: (err) => {
      const msg =
        err instanceof OperatorStoresError
          ? t(storesErrorKey(err.code))
          : err instanceof Error
            ? err.message
            : t('operatorPortal.storesErrors.billing_update_failed')
      show(msg)
    },
  })

  const online = isPosOnline(store.posLastSeenAt)
  const busy = save.isPending || markPaid.isPending

  return (
    <tr className="align-top">
      <td className="px-3 py-4">
        <p className="font-semibold text-slate-900">{store.label}</p>
        <code className="mt-1 block text-[12px] text-slate-500">{store.storeId}</code>
        <span
          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[12px] font-semibold ${
            online ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {online ? t('status.online') : t('status.offline')}
        </span>
      </td>
      <td className="px-3 py-4 text-[14px] text-slate-700">
        {store.ownerEmail ?? (
          <span className="text-slate-400">{t('operatorPortal.noOwnerEmail')}</span>
        )}
      </td>
      <td className="px-3 py-4">
        <Input
          type="email"
          className="min-w-[12rem]"
          value={draft.billingEmail}
          onChange={(e) => setDraft((d) => ({ ...d, billingEmail: e.target.value }))}
        />
      </td>
      <td className="px-3 py-4">
        <select
          className="w-full min-w-[7rem] rounded-md border-2 border-line bg-white px-3 py-2 text-[14px]"
          value={draft.billingInterval}
          onChange={(e) => setDraft((d) => ({ ...d, billingInterval: e.target.value }))}
        >
          {BILLING_INTERVALS.map((interval) => (
            <option key={interval} value={interval}>
              {t(`operatorPortal.billingInterval.${interval}`)}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-4">
        <Input
          type="date"
          value={draft.nextPaymentAt}
          onChange={(e) => setDraft((d) => ({ ...d, nextPaymentAt: e.target.value }))}
        />
      </td>
      <td className="px-3 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[13px] font-semibold ${
            store.billingPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
          }`}
        >
          {store.billingPaid
            ? t('operatorPortal.billingPaidYes')
            : t('operatorPortal.billingPaidNo')}
        </span>
      </td>
      <td className="px-3 py-4">
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => save.mutate()}>
            {save.isPending ? t('common.saving') : t('common.save')}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={busy || !draft.billingInterval}
            onClick={() => markPaid.mutate()}
          >
            {markPaid.isPending ? t('operatorPortal.markingPaid') : t('operatorPortal.markPaid')}
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function OperatorStoresTable({ accessToken }: { accessToken: string }) {
  const { t } = useTranslation()

  const { data: stores = [], isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['operator-stores'],
    queryFn: () => fetchOperatorStores(accessToken),
    enabled: Boolean(accessToken),
  })

  return (
    <section className="rounded-xl border-2 border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t('operatorPortal.storesTitle')}</h3>
          <p className="mt-1 text-[14px] text-slate-600">{t('operatorPortal.storesIntro')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isFetching}
          onClick={() => {
            void refetch()
          }}
        >
          {isFetching ? t('common.refreshing') : t('common.refresh')}
        </Button>
      </div>

      {isPending ? (
        <p className="mt-4 text-slate-600">{t('common.loading')}</p>
      ) : isError ? (
        <p className="mt-4 font-semibold text-danger">{t('operatorPortal.storesLoadFailed')}</p>
      ) : stores.length === 0 ? (
        <p className="mt-4 text-[15px] text-slate-600">{t('operatorPortal.storesEmpty')}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border-2 border-line">
          <table className="w-full min-w-[56rem] text-left text-[14px]">
            <thead className="border-b-2 border-line bg-surface/80 text-[13px] font-semibold text-slate-700">
              <tr>
                <th className="px-3 py-3">{t('operatorPortal.colStore')}</th>
                <th className="px-3 py-3">{t('operatorPortal.colOwner')}</th>
                <th className="px-3 py-3">{t('operatorPortal.colBillingEmail')}</th>
                <th className="px-3 py-3">{t('operatorPortal.colInterval')}</th>
                <th className="px-3 py-3">{t('operatorPortal.colNextPayment')}</th>
                <th className="px-3 py-3">{t('operatorPortal.colPaid')}</th>
                <th className="px-3 py-3">{t('operatorPortal.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {stores.map((store) => (
                <StoreBillingRow
                  key={`${store.storeId}-${store.billingPaid}-${store.nextPaymentAt ?? ''}`}
                  store={store}
                  accessToken={accessToken}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-[13px] text-slate-500">{t('operatorPortal.billingDiscordHint')}</p>
    </section>
  )
}
