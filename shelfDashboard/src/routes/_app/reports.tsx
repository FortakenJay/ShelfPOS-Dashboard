import { createFileRoute } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReportDateRangePanel } from '#/components/reports/ReportDateRangePanel'
import { ReportInventoryPagination } from '#/components/reports/ReportInventoryPagination'
import { ReportTable } from '#/components/reports/ReportTable'
import { ReportTypeTabs } from '#/components/reports/ReportTypeTabs'
import { runReport, fetchReportForExport } from '#/lib/queries/reports'
import { downloadReportExcel, downloadReportPdf } from '#/lib/reports-pdf'
import {
  clampInventoryPage,
  parseReportSearch,
  validateReportSearch,
} from '#/lib/reports-search'
import type { ReportData } from '#/lib/reports.types'
import { useStore } from '#/lib/store-context'
import { DASHBOARD_STALE_MS, QUERY_GC_MS } from '#/lib/stores'
import { Button } from '#/components/ui'

function cachedInventoryTotal(
  queryClient: QueryClient,
  storeId: string,
  range: { from: string; to: string },
): number {
  const entries = queryClient.getQueriesData<ReportData>({
    queryKey: ['report', storeId, 'inventory', range],
  })
  for (const [, data] of entries) {
    if (data?.type === 'inventory') return data.data.total
  }
  return 0
}

export const Route = createFileRoute('/_app/reports')({
  validateSearch: validateReportSearch,
  component: ReportsPage,
})

function ReportsPage() {
  const { storeId, storeLabel } = useStore()
  return <ReportsPageContent key={storeId} storeId={storeId} storeLabel={storeLabel} />
}

function ReportsPageContent({
  storeId,
  storeLabel,
}: {
  storeId: string
  storeLabel: string
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const urlSearch = Route.useSearch()
  const { type, range, inventoryPage, inventoryPageSize } = parseReportSearch(urlSearch)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const inventoryKnownTotal = cachedInventoryTotal(queryClient, storeId, range)
  const inventoryPageForQuery =
    type === 'inventory'
      ? clampInventoryPage(inventoryPage, inventoryKnownTotal, inventoryPageSize)
      : inventoryPage

  const { data: reportData, isFetching, isError } = useQuery({
    queryKey:
      type === 'inventory'
        ? ['report', storeId, type, range, inventoryPageForQuery, inventoryPageSize]
        : ['report', storeId, type, range],
    queryFn: () =>
      type === 'inventory'
        ? runReport(storeId, type, range, {
            page: inventoryPageForQuery,
            pageSize: inventoryPageSize,
          })
        : runReport(storeId, type, range),
    staleTime: DASHBOARD_STALE_MS,
    gcTime: QUERY_GC_MS,
    refetchOnWindowFocus: false,
  })

  const inventoryDisplayPage =
    reportData?.type === 'inventory' ? reportData.data.page : inventoryPageForQuery

  async function onDownload(format: 'excel' | 'pdf'): Promise<void> {
    if (exporting) return
    setExporting(format)
    setExportError(null)

    let report
    try {
      report = await fetchReportForExport(storeId, type, range)
    } catch {
      setExportError(
        format === 'excel' ? t('errors.xlsxExportFailed') : t('errors.pdfExportFailed'),
      )
      setExporting(null)
      return
    }

    const args = { report, storeId, storeLabel, range, t }
    try {
      if (format === 'excel') {
        await downloadReportExcel(args)
      } else {
        await downloadReportPdf(args)
      }
    } catch {
      setExportError(
        format === 'excel' ? t('errors.xlsxExportFailed') : t('errors.pdfExportFailed'),
      )
    }
    setExporting(null)
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
          <p className="mt-1 text-[14px] text-slate-500">{t('reports.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void onDownload('excel')}
            disabled={exporting !== null || isFetching}
          >
            {exporting === 'excel' ? t('reports.exportingExcel') : t('reports.exportExcel')}
          </Button>
          <Button
            variant="outline"
            onClick={() => void onDownload('pdf')}
            disabled={exporting !== null || isFetching}
          >
            {exporting === 'pdf' ? t('reports.exportingPdf') : t('reports.exportPdf')}
          </Button>
        </div>
      </div>
      {exportError && (
        <p className="mb-4 text-[14px] font-semibold text-danger">{exportError}</p>
      )}

      <ReportTypeTabs activeType={type} range={range} pageSize={inventoryPageSize} />

      <ReportDateRangePanel type={type} range={range} currentSearch={urlSearch} />

      <div className="overflow-x-auto rounded-lg border-2 border-line bg-white">
        {isFetching && !reportData ? (
          <p className="px-4 py-8 text-center text-slate-500">{t('common.loading')}</p>
        ) : isError ? (
          <p className="px-4 py-8 text-center font-semibold text-danger">
            {t('errors.loadReports')}
          </p>
        ) : (
          reportData && <ReportTable report={reportData} />
        )}
      </div>

      {reportData?.type === 'inventory' && (
        <ReportInventoryPagination
          page={inventoryDisplayPage}
          pageSize={reportData.data.pageSize}
          total={reportData.data.total}
          loading={isFetching}
          search={urlSearch}
        />
      )}

      {type !== 'inventory' && (
        <p className="mt-3 text-[13px] text-slate-500">{t('reports.profitHint')}</p>
      )}
      {type === 'inventory' && (
        <p className="mt-3 text-[13px] text-slate-500">
          {t('reports.inventory.snapshotNote')}
        </p>
      )}
    </div>
  )
}
