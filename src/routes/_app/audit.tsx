import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '#/lib/i18n'
import { Button, Input, Select, Td, Th } from '#/components/ui'
import { rangeForReportPeriod } from '#/lib/dateRangePresets'
import { formatDateTime } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import {
  fetchAuditActions,
  fetchAuditLog,
  fetchAuditUsers,
} from '#/lib/queries/audit'
import type { ReportPeriodPreset } from '#/lib/reports.types'
import { useStore } from '#/lib/store-context'
import { DASHBOARD_POLL_MS, DASHBOARD_STALE_MS, QUERY_GC_MS } from '#/lib/stores'
import type { DateRange } from '#/lib/types'

function formatAuditDetail(actionKey: string, detail: string | null): string {
  if (!detail) return '—'
  if (actionKey.startsWith('cart_tab_discarded_')) {
    try {
      const parsed = JSON.parse(detail) as { label?: string; total?: number }
      if (parsed.label && typeof parsed.total === 'number') {
        return `${parsed.label} · ${formatMoney(parsed.total)}`
      }
    } catch {
      /* use raw detail */
    }
  }
  return detail
}

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const
const DEFAULT_PAGE_SIZE = 50

interface AuditLogState {
  period: ReportPeriodPreset | 'all' | 'range'
  range: DateRange | null
  userId: number | ''
  action: string
  page: number
  pageSize: number
}

type AuditLogAction =
  | { type: 'setPeriod'; period: ReportPeriodPreset | 'all' | 'range' }
  | { type: 'setRange'; range: DateRange | null }
  | { type: 'setUserId'; userId: number | '' }
  | { type: 'setAction'; action: string }
  | { type: 'setPage'; page: number }
  | { type: 'setPageSize'; pageSize: number }

function auditLogReducer(state: AuditLogState, action: AuditLogAction): AuditLogState {
  switch (action.type) {
    case 'setPeriod':
      if (action.period === 'all') {
        return { ...state, period: action.period, range: null, page: 1 }
      }
      if (action.period === 'range') {
        return {
          ...state,
          period: action.period,
          range: state.range ?? rangeForReportPeriod('today'),
          page: 1,
        }
      }
      return {
        ...state,
        period: action.period,
        range: rangeForReportPeriod(action.period),
        page: 1,
      }
    case 'setRange':
      return { ...state, range: action.range, period: action.range ? 'range' : 'all', page: 1 }
    case 'setUserId':
      return { ...state, userId: action.userId, page: 1 }
    case 'setAction':
      return { ...state, action: action.action, page: 1 }
    case 'setPage':
      return { ...state, page: action.page }
    case 'setPageSize':
      return { ...state, pageSize: action.pageSize, page: 1 }
    default:
      return state
  }
}

export const Route = createFileRoute('/_app/audit')({
  component: AuditPage,
})

function AuditPage() {
  const { t } = useTranslation()
  const { storeId } = useStore()
  const [{ period, range, userId, action, page, pageSize }, dispatch] = useReducer(
    auditLogReducer,
    {
      period: 'all',
      range: null,
      userId: '',
      action: '',
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    },
  )

  const { data: auditUsers } = useQuery({
    queryKey: ['auditUsers', storeId],
    queryFn: () => fetchAuditUsers(storeId),
    staleTime: DASHBOARD_STALE_MS,
    gcTime: QUERY_GC_MS,
  })
  const { data: auditActions } = useQuery({
    queryKey: ['auditActions', storeId],
    queryFn: () => fetchAuditActions(storeId),
    staleTime: DASHBOARD_STALE_MS,
    gcTime: QUERY_GC_MS,
  })
  const { data: auditPage, isFetching, isError } = useQuery({
    queryKey: ['audit', storeId, range, userId, action, page, pageSize],
    queryFn: () =>
      fetchAuditLog(storeId, {
        range,
        userId: userId === '' ? undefined : Number(userId),
        action: action || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
    staleTime: DASHBOARD_STALE_MS,
    gcTime: QUERY_GC_MS,
    refetchInterval: DASHBOARD_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })

  const total = auditPage?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const rows = auditPage?.rows ?? []
  const from = rows.length === 0 ? 0 : (page - 1) * pageSize + 1
  const to = rows.length === 0 ? 0 : from + rows.length - 1
  const outOfRangePage =
    (total > 0 && page > totalPages) || (page > 1 && rows.length === 0 && !isFetching)
  const summaryCount = isFetching ? t('common.dash') : String(total)

  const actionLabel = (actionKey: string): string => {
    const key = `audit.actions.${actionKey}`
    return i18n.exists(key) ? t(key) : actionKey
  }

  return (
    <div className="p-6">
      <h1 className="mb-5 text-2xl font-bold">{t('audit.title')}</h1>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          variant={period === 'all' ? 'primary' : 'outline'}
          onClick={() => dispatch({ type: 'setPeriod', period: 'all' })}
        >
          {t('audit.allTime')}
        </Button>
        <Button
          variant={period === 'today' ? 'primary' : 'outline'}
          onClick={() => dispatch({ type: 'setPeriod', period: 'today' })}
        >
          {t('reports.presets.today')}
        </Button>
        <Button
          variant={period === 'week' ? 'primary' : 'outline'}
          onClick={() => dispatch({ type: 'setPeriod', period: 'week' })}
        >
          {t('reports.presets.week')}
        </Button>
        <Button
          variant={period === 'month' ? 'primary' : 'outline'}
          onClick={() => dispatch({ type: 'setPeriod', period: 'month' })}
        >
          {t('reports.presets.month')}
        </Button>
        <Button
          variant={period === 'range' ? 'primary' : 'outline'}
          onClick={() => dispatch({ type: 'setPeriod', period: 'range' })}
        >
          {t('audit.range')}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {period === 'range' && range && (
          <>
            <label className="text-[13px] font-semibold text-slate-600">
              {t('reports.from')}
              <Input
                type="date"
                className="mt-1 w-44"
                value={range.from}
                max={range.to}
                onChange={(e) =>
                  e.target.value &&
                  dispatch({
                    type: 'setRange',
                    range: { ...range, from: e.target.value },
                  })
                }
              />
            </label>
            <label className="text-[13px] font-semibold text-slate-600">
              {t('reports.to')}
              <Input
                type="date"
                className="mt-1 w-44"
                value={range.to}
                min={range.from}
                onChange={(e) =>
                  e.target.value &&
                  dispatch({
                    type: 'setRange',
                    range: { ...range, to: e.target.value },
                  })
                }
              />
            </label>
          </>
        )}
        {period === 'all' && (
          <p className="text-[14px] text-slate-600">
            {t('audit.allTimeSummary', { count: summaryCount, total: summaryCount })}
          </p>
        )}
        <Select
          value={userId === '' ? '' : String(userId)}
          onChange={(e) =>
            dispatch({
              type: 'setUserId',
              userId: e.target.value === '' ? '' : Number(e.target.value),
            })
          }
          className="w-52"
          aria-label={t('audit.user')}
        >
          <option value="">{t('audit.allUsers')}</option>
          {auditUsers?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.username}
            </option>
          ))}
        </Select>
        <Select
          value={action}
          onChange={(e) => dispatch({ type: 'setAction', action: e.target.value })}
          className="w-64"
          aria-label={t('audit.action')}
        >
          <option value="">{t('audit.allActions')}</option>
          {auditActions?.map((a) => (
            <option key={a} value={a}>
              {actionLabel(a)}
            </option>
          ))}
        </Select>
      </div>

      {isError && (
        <p className="mb-3 font-semibold text-danger">{t('errors.loadAudit')}</p>
      )}

      <div className="overflow-hidden rounded-lg border-2 border-line bg-white">
        <table className="w-full min-w-[960px]">
          <thead>
            <tr>
              <Th>{t('common.date')}</Th>
              <Th>{t('audit.user')}</Th>
              <Th>{t('audit.action')}</Th>
              <Th>{t('audit.entity')}</Th>
              <Th>{t('audit.detail')}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !isFetching && (
              <tr>
                <td
                  colSpan={5}
                  className="border-b border-line px-4 py-6 text-center text-[15px] text-slate-500"
                >
                  {t('common.noData')}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <Td className="whitespace-nowrap">{formatDateTime(row.created_at)}</Td>
                <Td className="font-semibold">{row.username ?? '—'}</Td>
                <Td>{actionLabel(row.action)}</Td>
                <Td className="text-slate-500">
                  {row.entity ?? '—'}
                  {row.entity_id ? ` #${row.entity_id}` : ''}
                </Td>
                <Td className="text-slate-500">
                  {formatAuditDetail(row.action, row.detail)}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {outOfRangePage && (
        <div className="mt-3 rounded-lg border-2 border-warning bg-amber-50 px-3 py-2 text-[14px] font-semibold text-warning">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{t('audit.pageOutOfRange')}</span>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: 'setPage', page: 1 })}
            >
              {t('audit.resetPage')}
            </Button>
          </div>
        </div>
      )}

      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] text-slate-600">
            {t('audit.showing', { from, to, total })}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[14px] text-slate-600">
              <span>{t('products.pagination.perPage')}</span>
              <Select
                value={String(pageSize)}
                onChange={(e) =>
                  dispatch({ type: 'setPageSize', pageSize: Number(e.target.value) })
                }
                className="w-20"
                aria-label={t('products.pagination.perPage')}
                disabled={isFetching}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </label>
            <span className="text-[14px] text-slate-600">
              {t('audit.pageOf', { page, pages: totalPages })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1 || isFetching}
                onClick={() => dispatch({ type: 'setPage', page: page - 1 })}
              >
                {t('common.back')}
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages || isFetching}
                onClick={() => dispatch({ type: 'setPage', page: page + 1 })}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
