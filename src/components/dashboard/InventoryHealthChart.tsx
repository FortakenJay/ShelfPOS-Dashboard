import { useTranslation } from 'react-i18next'
import type { DashboardInventoryHealth } from '#/lib/types'
import { ChartFrame } from '#/components/dashboard/ChartFrame'
import { ChartLoading } from '#/components/dashboard/ChartLoading'
import {
  DashboardCard,
  DashboardEmpty,
} from '#/components/dashboard/DashboardPrimitives'
import { useRechartsModule } from '#/hooks/useRechartsModule'

const CHART_COLORS = ['#16a34a', '#d97706', '#dc2626', '#7c3aed']

export function InventoryHealthChart({
  health,
}: {
  health: DashboardInventoryHealth
}) {
  const { t } = useTranslation()
  const recharts = useRechartsModule()
  const slices = [
    { name: t('dashboard.stockStatus.healthy'), value: health.healthy },
    { name: t('dashboard.stockStatus.low'), value: health.low },
    { name: t('dashboard.stockStatus.critical'), value: health.critical },
    { name: t('dashboard.stockStatus.negative'), value: health.negative },
  ].filter((s) => s.value > 0)

  if (!recharts) return <ChartLoading />

  const { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } =
    recharts

  return (
    <DashboardCard title={t('dashboard.charts.inventoryHealth')}>
      {slices.length === 0 ? (
        <DashboardEmpty message={t('common.noData')} />
      ) : (
        <ChartFrame heightClass="h-56">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={72}
              >
                {slices.map((slice, index) => (
                  <Cell
                    key={slice.name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>
      )}
    </DashboardCard>
  )
}
