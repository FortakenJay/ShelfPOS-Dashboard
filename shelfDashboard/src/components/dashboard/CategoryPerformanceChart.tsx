import { useTranslation } from 'react-i18next'
import { formatMoney } from '#/lib/money'
import type { DashboardData } from '#/lib/types'
import { ChartFrame } from '#/components/dashboard/ChartFrame'
import { ChartLoading } from '#/components/dashboard/ChartLoading'
import { DashboardEmpty } from '#/components/dashboard/DashboardPrimitives'
import { useRechartsModule } from '#/hooks/useRechartsModule'

export function CategoryPerformanceChart({
  categories,
}: {
  categories: DashboardData['categoryPerformance']
}): React.JSX.Element {
  const { t } = useTranslation()
  const recharts = useRechartsModule()

  if (categories.length === 0) {
    return <DashboardEmpty message={t('common.noData')} />
  }
  if (!recharts) return <ChartLoading />

  const { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } =
    recharts

  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={categories} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fontSize: 11 }}
            width={100}
          />
          <Tooltip formatter={(v) => formatMoney(Number(v))} />
          <Bar dataKey="revenue" fill="#7c3aed" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
