import { useTranslation } from 'react-i18next'
import type { DashboardData } from '#/lib/types'
import { ChartFrame } from '#/components/dashboard/ChartFrame'
import { ChartLoading } from '#/components/dashboard/ChartLoading'
import { DashboardEmpty } from '#/components/dashboard/DashboardPrimitives'
import { useRechartsModule } from '#/hooks/useRechartsModule'

export function TransactionTrendChart({
  data,
}: {
  data: DashboardData['salesTrend']
}): React.JSX.Element {
  const { t } = useTranslation()
  const recharts = useRechartsModule()
  const chartData = data.map((d) => ({
    label: d.date.slice(5),
    transactions: d.transactions,
  }))

  if (chartData.every((d) => d.transactions === 0)) {
    return <DashboardEmpty message={t('dashboard.noSales30')} />
  }
  if (!recharts) return <ChartLoading />

  const { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } =
    recharts

  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="transactions" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
