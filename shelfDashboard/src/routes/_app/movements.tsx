import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CashMovementsTable } from '#/components/cash/CashMovementsTable'
import { DateRangePicker } from '#/components/DateRangePicker'
import { ReportPagination } from '#/components/reports/ReportPagination'
import { Button, FullScreenSpinner } from '#/components/ui'
import { presetToday } from '#/lib/dateRangePresets'
import {
  CASH_MOVEMENTS_PAGE_SIZE_DEFAULT,
  fetchCashMovements,
} from '#/lib/queries/cash-movements'
import { useStore } from '#/lib/store-context'
import { DASHBOARD_POLL_MS, DASHBOARD_STALE_MS, QUERY_GC_MS } from '#/lib/stores'
import type { DateRange } from '#/lib/types'

export const Route = createFileRoute('/_app/movements')({
  component: MovementsPage,
})

function MovementsPage() {
  const { t } = useTranslation()
  const { storeId } = useStore()
  const [range, setRange] = useState<DateRange>(() => presetToday())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(CASH_MOVEMENTS_PAGE_SIZE_DEFAULT)

  const onRangeChange = (next: DateRange): void => {
    setRange(next)
    setPage(1)
  }

  const {
    data: result,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ['cash-movements', storeId, range.from, range.to, page, pageSize],
    queryFn: () => fetchCashMovements(storeId, range.from, range.to, { page, pageSize }),
    staleTime: DASHBOARD_STALE_MS,
    gcTime: QUERY_GC_MS,
    refetchInterval: DASHBOARD_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })

  const movements = result?.rows ?? []
  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageOutOfRange =
    (total > 0 && page > totalPages) || (page > 1 && movements.length === 0 && !isFetching)

  return (
    <div className="p-6">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold">{t('cash.adminTitle')}</h1>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <DateRangePicker value={range} onChange={onRangeChange} />
        </div>

        {isLoading && <FullScreenSpinner />}
        {isError && (
          <p className="font-semibold text-danger">{t('errors.loadMovements')}</p>
        )}

        {!isLoading && !isError && pageOutOfRange && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-[14px] font-semibold text-amber-900">
            <span>{t('audit.pageOutOfRange')}</span>
            <Button variant="outline" size="md" onClick={() => setPage(1)}>
              {t('audit.resetPage')}
            </Button>
          </div>
        )}

        {!isLoading && !isError && <CashMovementsTable movements={movements} />}

        {!isLoading && !isError && (
          <ReportPagination
            page={page}
            pageSize={pageSize}
            total={total}
            loading={isFetching}
            onPageChange={setPage}
            onPageSizeChange={(next) => {
              setPageSize(next)
              setPage(1)
            }}
          />
        )}
      </div>
    </div>
  )
}
