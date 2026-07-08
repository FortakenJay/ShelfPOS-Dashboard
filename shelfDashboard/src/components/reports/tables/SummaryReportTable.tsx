import { useTranslation } from 'react-i18next'
import { Td, Th } from '#/components/ui'
import { formatReportTimestamp } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import type { SalesSummaryReport } from '#/lib/reports.types'

export function SummaryReportTable({ data }: { data: SalesSummaryReport }) {
  const { t } = useTranslation()
  const periodRows: [string, string][] = [
    [t('reports.summary.totalRevenue'), formatMoney(data.totalRevenue)],
    [t('reports.summary.totalDiscount'), formatMoney(data.totalDiscount)],
    [t('reports.summary.grossProfit'), formatMoney(data.grossProfit)],
    [t('reports.summary.txCount'), String(data.txCount)],
    [t('reports.summary.itemsSold'), String(data.itemsSold)],
    [t('reports.summary.returnsCount'), String(data.returnsCount)],
    [t('reports.summary.avgTicket'), formatMoney(data.avgTicket)],
    [t('reports.summary.openingFloat'), formatMoney(data.cash.openingFloat)],
    [t('reports.summary.cashSales'), formatMoney(data.cash.cashSales)],
    [t('reports.summary.cashIn'), formatMoney(data.cash.cashIn)],
    [t('reports.summary.cashOut'), formatMoney(data.cash.cashOut)],
  ]

  const showDaily = (data.days?.length ?? 0) > 0

  return (
    <div className="text-left">
      {showDaily && (
        <table className="mb-6 w-full">
          <thead>
            <tr>
              <Th
                colSpan={4}
                className="bg-slate-50 text-left text-[13px] uppercase tracking-wide text-slate-600"
              >
                {t('reports.summary.dailyBreakdown')}
              </Th>
            </tr>
            <tr>
              <Th className="text-left">{t('reports.summary.date')}</Th>
              <Th className="text-right">{t('reports.summary.totalRevenue')}</Th>
              <Th className="text-right">{t('reports.summary.txCount')}</Th>
              <Th className="text-right">{t('reports.summary.avgTicket')}</Th>
            </tr>
          </thead>
          <tbody>
            {data.days?.map((day) => (
              <tr key={day.date} className="border-b border-line/60">
                <Td className="text-left font-medium">
                  {formatReportTimestamp(day.date, false)}
                </Td>
                <Td className="text-right font-semibold">{formatMoney(day.totalRevenue)}</Td>
                <Td className="text-right">{day.txCount}</Td>
                <Td className="text-right">{formatMoney(day.avgTicket)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <table className="w-full">
        {showDaily && (
          <thead>
            <tr>
              <Th
                colSpan={2}
                className="border-t-2 border-line bg-slate-50 text-left text-[14px] font-bold uppercase tracking-wide text-slate-700"
              >
                {t('reports.summary.periodTotal')}
              </Th>
            </tr>
          </thead>
        )}
        <tbody>
          {periodRows.map(([label, value]) => (
            <tr key={label}>
              <Td className="text-left font-semibold">{label}</Td>
              <Td className="text-right text-[17px] font-bold">{value}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
