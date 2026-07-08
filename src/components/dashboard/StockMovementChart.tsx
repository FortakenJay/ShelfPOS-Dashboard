import { useTranslation } from 'react-i18next'
import type { DashboardStockMovementPoint } from '#/lib/types'
import { ChartFrame } from '#/components/dashboard/ChartFrame'
import { ChartLoading } from '#/components/dashboard/ChartLoading'
import {
  DashboardCard,
  DashboardEmpty,
} from '#/components/dashboard/DashboardPrimitives'
import { useRechartsModule } from '#/hooks/useRechartsModule'

export function StockMovementChart({
  data,
}: {
  data: DashboardStockMovementPoint[]
}) {
  const { t } = useTranslation()
  const recharts = useRechartsModule()
  const chartData = data.map((d) => ({
    label: d.date.slice(5),
    netDelta: d.netDelta,
  }))

  if (!recharts) return <ChartLoading />

  const { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } =
    recharts

  return (
    <DashboardCard
      title={t('dashboard.charts.stockMovement')}
      subtitle={t('dashboard.charts.last30Days')}
    >
      {chartData.every((d) => d.netDelta === 0) ? (
        <DashboardEmpty message={t('common.noData')} />
      ) : (
        <ChartFrame heightClass="h-56">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Bar dataKey="netDelta" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      )}
    </DashboardCard>
  )
}
