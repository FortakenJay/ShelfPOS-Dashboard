import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DateRangePicker } from '#/components/DateRangePicker'
import { SectionHeading } from '#/components/dashboard/DashboardPrimitives'
import { Button, FullScreenSpinner, Td, Th } from '#/components/ui'
import { presetToday } from '#/lib/dateRangePresets'
import { formatDateTime, rangeBounds } from '#/lib/dates'
import { downloadCierresPdf } from '#/lib/cierres-pdf'
import { formatMoney } from '#/lib/money'
import { fetchCierres } from '#/lib/queries/cierres'
import { useStore } from '#/lib/store-context'
import { DASHBOARD_POLL_MS, DASHBOARD_STALE_MS, QUERY_GC_MS } from '#/lib/stores'
import type { CierreRow, DateRange } from '#/lib/types'

const DISPLAY_LIMIT = 500

export const Route = createFileRoute('/_app/cierres')({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === 'string' ? search.from : undefined,
    to: typeof search.to === 'string' ? search.to : undefined,
  }),
  component: CierresPage,
})

function CierresPage() {
  const { t } = useTranslation()
  const { storeId } = useStore()
  const search = Route.useSearch()
  const [range, setRange] = useState<DateRange>(() =>
    search.from && search.to
      ? { from: search.from, to: search.to }
      : presetToday(),
  )
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const bounds = rangeBounds(range.from, range.to)

  const {
    data: cierresPage,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['cierres', storeId, bounds.from, bounds.to],
    queryFn: () => fetchCierres(storeId, { from: bounds.from, to: bounds.to, limit: DISPLAY_LIMIT + 1 }),
    staleTime: DASHBOARD_STALE_MS,
    gcTime: QUERY_GC_MS,
    refetchInterval: DASHBOARD_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })
  const rows = cierresPage?.rows ?? []
  const visibleRows = rows.slice(0, DISPLAY_LIMIT)
  const totalRows = cierresPage?.total ?? 0
  const hasExactTotal = cierresPage?.hasExactTotal ?? false
  const truncated = hasExactTotal ? totalRows > visibleRows.length : rows.length > DISPLAY_LIMIT
  const hasFreshData = !isError

  const totals = (hasFreshData ? visibleRows : []).reduce(
    (acc, row) => {
      acc.sales += row.total_sales ?? 0
      acc.cash += row.total_cash ?? 0
      acc.card += row.total_card ?? 0
      acc.sinpe += row.total_sinpe ?? 0
      return acc
    },
    { sales: 0, cash: 0, card: 0, sinpe: 0 },
  )

  async function onDownloadPdf(): Promise<void> {
    if (visibleRows.length === 0 || exporting) return
    setExporting(true)
    setExportError(null)
    await downloadCierresPdf({
      rows: visibleRows,
      storeId,
      from: bounds.from.slice(0, 10),
      to: bounds.to.slice(0, 10),
      t,
    })
      .catch(() => {
        setExportError(t('errors.pdfExportFailed'))
      })
      .finally(() => {
        setExporting(false)
      })
  }

  async function onDownloadSinglePdf(row: CierreRow): Promise<void> {
    if (exporting) return
    setExporting(true)
    setExportError(null)
    await downloadCierresPdf({
      rows: [row],
      storeId,
      from: bounds.from.slice(0, 10),
      to: bounds.to.slice(0, 10),
      t,
    })
      .catch(() => {
        setExportError(t('errors.pdfExportFailed'))
      })
      .finally(() => {
        setExporting(false)
      })
  }

  const countLabel = isLoading || isError
    ? t('common.dash')
    : hasExactTotal
      ? String(totalRows)
      : truncated
        ? `${DISPLAY_LIMIT}+`
        : String(visibleRows.length)
  const salesMetric = isLoading || isError ? t('common.dash') : truncated ? t('common.dash') : formatMoney(totals.sales)
  const cashMetric = isLoading || isError ? t('common.dash') : truncated ? t('common.dash') : formatMoney(totals.cash)
  const cardMetric = isLoading || isError ? t('common.dash') : truncated ? t('common.dash') : formatMoney(totals.card)
  const sinpeMetric = isLoading || isError ? t('common.dash') : truncated ? t('common.dash') : formatMoney(totals.sinpe)

  return (
    <div className="space-y-6 p-6">
      <SectionHeading
        title={t('cierres.title')}
        description={t('cierres.description')}
      />

      <div className="rounded-lg border-2 border-line bg-white p-4">
        <h2 className="mb-3 text-lg font-bold">{t('cierres.previous')}</h2>
        <DateRangePicker value={range} onChange={setRange} />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {t('cierres.filteredRangeSummary', { from: bounds.from.slice(0, 10), to: bounds.to.slice(0, 10), count: countLabel })}
          </p>
          <Button variant="outline" onClick={() => void onDownloadPdf()} disabled={isLoading || isError || visibleRows.length === 0 || exporting || truncated}>
            {exporting ? t('cierres.exportingPdf') : t('cierres.downloadPdf')}
          </Button>
        </div>
        {!isLoading && !isError && truncated && (
          <p className="mt-3 text-sm font-semibold text-warning">
            {hasExactTotal
              ? t('cierres.truncatedWarning', { shown: visibleRows.length, total: totalRows })
              : t('cierres.truncatedWarningUnknownTotal', { shown: visibleRows.length })}
          </p>
        )}
        {exportError && (
          <p className="mt-3 text-sm font-semibold text-danger">{exportError}</p>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label={t('cierres.sales')} value={salesMetric} />
          <Metric label={t('cierres.cash')} value={cashMetric} />
          <Metric label={t('cierres.card')} value={cardMetric} />
          <Metric label={t('cierres.sinpe')} value={sinpeMetric} />
        </div>
      </div>

      {!isLoading && !isError && (
        <div className="rounded-lg border-2 border-line bg-white p-4">
          <h2 className="mb-3 text-lg font-bold">{t('cierres.previous')}</h2>
          <div className="overflow-x-auto rounded-lg border-2 border-line bg-white">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr>
                  <Th>{t('cierres.closed')}</Th>
                  <Th>{t('cierres.cashier')}</Th>
                  <Th>{t('cierres.cash')}</Th>
                  <Th>{t('cierres.card')}</Th>
                  <Th>{t('cierres.sinpe')}</Th>
                  <Th>{t('common.total')}</Th>
                  <Th>{t('cierres.difference')}</Th>
                  <Th>{t('common.actions')}</Th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="border-b border-line px-4 py-8 text-center text-[15px] text-slate-500"
                    >
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((c) => {
                    const diff = c.cash_difference ?? 0
                    const hasDiff = Math.abs(diff) >= 0.01
                    const total = (c.total_sales ?? 0)
                    return (
                      <tr
                        key={c.id}
                        className={hasDiff ? 'bg-red-50/50' : undefined}
                      >
                        <Td>{formatDateTime(c.closed_at)}</Td>
                        <Td>{c.closed_by_username ?? t('common.dash')}</Td>
                        <Td className="tabular-nums">{formatMoney(c.total_cash ?? 0)}</Td>
                        <Td className="tabular-nums">{formatMoney(c.total_card ?? 0)}</Td>
                        <Td className="tabular-nums">{formatMoney(c.total_sinpe ?? 0)}</Td>
                        <Td className="tabular-nums font-semibold">{formatMoney(total)}</Td>
                        <Td
                          className={`tabular-nums font-bold ${hasDiff ? 'text-danger' : 'text-cta'}`}
                        >
                          {formatMoney(diff)}
                        </Td>
                        <Td className="text-right">
                          <Button
                            variant="outline"
                            size="md"
                            disabled={exporting}
                            onClick={() => void onDownloadSinglePdf(c)}
                          >
                            {t('cierres.savePdf')}
                          </Button>
                        </Td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isLoading && <FullScreenSpinner />}
      {isError && (
        <p className="font-semibold text-danger">{t('errors.loadCierres')}</p>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border-2 border-line bg-white px-3 py-3">
      <p className="text-[12px] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
