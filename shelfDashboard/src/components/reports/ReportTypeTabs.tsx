import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { ReportType } from '#/lib/reports.types'
import type { DateRange } from '#/lib/types'
import { searchForReportType } from '#/lib/reports-search'

const REPORT_TYPES: ReportType[] = [
  'summary',
  'byPayment',
  'topProducts',
  'inventory',
  'taxBreakdown',
  'transactionLog',
  'itemizedSales',
]

export function ReportTypeTabs({
  activeType,
  range,
  pageSize,
}: {
  activeType: ReportType
  range: DateRange
  pageSize: number
}) {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex flex-wrap justify-start gap-2">
      {REPORT_TYPES.map((rt) => (
        <Link
          key={rt}
          to="/reports"
          search={searchForReportType(rt, range, pageSize)}
          replace
          className={`inline-flex min-h-[44px] items-center justify-center rounded-md border-2 px-4 text-center text-[15px] font-bold ${
            activeType === rt
              ? 'border-primary bg-primary text-white'
              : 'border-line bg-white text-slate-700 hover:border-primary'
          }`}
        >
          {t(`reports.types.${rt}`)}
        </Link>
      ))}
    </div>
  )
}

export { REPORT_TYPES }
