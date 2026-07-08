import { useTranslation } from 'react-i18next'
import { formatMoney } from '#/lib/money'
import type { DashboardData } from '#/lib/types'
import { ChartFrame } from '#/components/dashboard/ChartFrame'
import { ChartLoading } from '#/components/dashboard/ChartLoading'
import { DashboardEmpty } from '#/components/dashboard/DashboardPrimitives'
import { useRechartsModule } from '#/hooks/useRechartsModule'

export function SalesTrendChart({
  data,
}: {
  data: DashboardData['salesTrend']
}): React.JSX.Element {
  const { t } = useTranslation()
  const recharts = useRechartsModule()

  if (data.every((d) => d.transactions === 0)) {
    return <DashboardEmpty message={t('dashboard.noSales30')} />
  }
  if (!recharts) return <ChartLoading />

  const {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
  } = recharts

  return (
    <ChartFrame heightClass="h-64">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₡${v}`} />
          <Tooltip formatter={(v) => formatMoney(Number(v))} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
