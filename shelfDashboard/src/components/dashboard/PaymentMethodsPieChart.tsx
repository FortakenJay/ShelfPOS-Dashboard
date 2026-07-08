import { formatMoney } from '#/lib/money'
import { ChartFrame } from '#/components/dashboard/ChartFrame'
import { ChartLoading } from '#/components/dashboard/ChartLoading'
import { useRechartsModule } from '#/hooks/useRechartsModule'

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2']

export function PaymentMethodsPieChart({
  slices,
}: {
  slices: { name: string; value: number }[]
}): React.JSX.Element {
  const recharts = useRechartsModule()

  if (!recharts) return <ChartLoading />

  const { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } = recharts

  return (
    <ChartFrame heightClass="h-72">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <PieChart margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="42%"
            outerRadius={56}
            paddingAngle={2}
          >
            {slices.map((slice, index) => (
              <Cell
                key={slice.name}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatMoney(Number(v))} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, lineHeight: '18px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
