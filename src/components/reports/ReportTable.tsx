import type { ReportData } from '#/lib/reports.types'
import { ByPaymentReportTable } from '#/components/reports/tables/ByPaymentReportTable'
import { InventoryReportTable } from '#/components/reports/tables/InventoryReportTable'
import { ItemizedSalesReportTable } from '#/components/reports/tables/ItemizedSalesReportTable'
import { SummaryReportTable } from '#/components/reports/tables/SummaryReportTable'
import { TaxBreakdownReportTable } from '#/components/reports/tables/TaxBreakdownReportTable'
import { TopProductsReportTable } from '#/components/reports/tables/TopProductsReportTable'
import { TransactionLogReportTable } from '#/components/reports/tables/TransactionLogReportTable'

export function ReportTable({ report }: { report: ReportData }) {
  switch (report.type) {
    case 'summary':
      return <SummaryReportTable data={report.data} />
    case 'byPayment':
      return <ByPaymentReportTable data={report.data} />
    case 'topProducts':
      return <TopProductsReportTable rows={report.data} />
    case 'transactionLog':
      return <TransactionLogReportTable data={report.data} />
    case 'itemizedSales':
      return <ItemizedSalesReportTable data={report.data} />
    case 'taxBreakdown':
      return <TaxBreakdownReportTable data={report.data} />
    case 'inventory':
      return <InventoryReportTable data={report.data} />
    default:
      return null
  }
}
