import { buildReportPrintLines } from '#/lib/reports/build-report-print-lines'
import { buildCombinedFacturaHtml } from '#/lib/factura-pdf'
import { downloadFacturaHtml } from '#/lib/download-factura-pdf'
import { fetchFacturaPdfDataBatch } from '#/lib/queries/factura-pdf'
import { downloadReportGridXlsx } from '#/lib/reports/report-grid-to-xlsx'
import { downloadPrintLinesPdf } from '#/lib/reports/print-lines-to-pdf'
import type { DateRange } from '#/lib/types'
import type { ReportData } from '#/lib/reports.types'

type Translate = (key: string, vars?: Record<string, string | number>) => string

function exportBasename(report: ReportData, range: DateRange): string {
  return `reporte-${report.type}-${range.from}-${range.to}`
}

function buildLines(
  report: ReportData,
  storeLabel: string,
  range: DateRange,
  t: Translate,
) {
  return buildReportPrintLines(report, range, t, storeLabel)
}

export async function downloadReportExcel(args: {
  report: ReportData
  storeLabel: string
  range: DateRange
  t: Translate
}): Promise<void> {
  const { report, storeLabel, range, t } = args
  await downloadReportGridXlsx({
    report,
    storeLabel,
    range,
    t,
    filename: `${exportBasename(report, range)}.xlsx`,
  })
}

export async function downloadReportPdf(args: {
  report: ReportData
  storeId: string
  storeLabel: string
  range: DateRange
  t: Translate
}): Promise<void> {
  const { report, storeId, storeLabel, range, t } = args

  if (report.type === 'itemizedSales' || report.type === 'transactionLog') {
    const saleIds =
      report.type === 'itemizedSales'
        ? report.data.sales.map((sale) => sale.saleId)
        : report.data.rows.map((row) => row.saleId)
    const documents = await fetchFacturaPdfDataBatch(storeId, saleIds, storeLabel)
    if (documents.length === 0) {
      throw new Error('errors.pdfExportFailed')
    }
    const html = buildCombinedFacturaHtml(documents)
    await downloadFacturaHtml(html, `${exportBasename(report, range)}.pdf`)
    return
  }

  const lines = buildLines(report, storeLabel, range, t)
  await downloadPrintLinesPdf(lines, `${exportBasename(report, range)}.pdf`)
}
