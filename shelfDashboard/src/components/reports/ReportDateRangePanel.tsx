import { useNavigate } from '@tanstack/react-router'
import { DateRangePicker } from '#/components/DateRangePicker'
import type { ReportSearch } from '#/lib/reports-search'
import { reportSearchFromRange } from '#/lib/reports-search'
import type { ReportType } from '#/lib/reports.types'
import type { DateRange } from '#/lib/types'

export function ReportDateRangePanel({
  type,
  range,
  currentSearch,
}: {
  type: ReportType
  range: DateRange
  currentSearch: ReportSearch
}) {
  const navigate = useNavigate()

  if (type === 'inventory') return null

  return (
    <div className="mb-5">
      <DateRangePicker
        value={range}
        showTime={type === 'transactionLog' || type === 'itemizedSales'}
        onChange={(nextRange) => {
          void navigate({
            to: '/reports',
            search: reportSearchFromRange(type, nextRange, currentSearch),
            replace: true,
          })
        }}
      />
    </div>
  )
}
