import { useTranslation } from 'react-i18next'
import { formatMoney } from '#/lib/money'
import type { DashboardData } from '#/lib/types'
import {
  DashboardCard,
  DashboardEmpty,
} from '#/components/dashboard/DashboardPrimitives'
import { ChartFrame } from '#/components/dashboard/ChartFrame'
import { ChartLoading } from '#/components/dashboard/ChartLoading'
import { PaymentMethodsPieChart } from '#/components/dashboard/PaymentMethodsPieChart'
import { useRechartsModule } from '#/hooks/useRechartsModule'

export function DashboardHomeCharts({
  data,
}: {
  data: DashboardData
}): React.JSX.Element {
  const { t } = useTranslation()
  const recharts = useRechartsModule()

  const revenueTrend = data.salesTrend.map((d) => ({
    label: d.date.slice(5),
    revenue: d.revenue,
  }))

  const hourly = data.salesByHour.map((d) => ({
    hour: `${String(d.hour).padStart(2, '0')}:00`,
    transactions: d.transactions,
  }))

  const paymentSlices = [
    { name: t('payment.cash'), value: data.paymentToday.cash },
    { name: t('payment.card'), value: data.paymentToday.card },
    { name: t('payment.sinpe'), value: data.paymentToday.sinpe },
  ].filter((s) => s.value > 0)

  if (!recharts) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartLoading />
        <ChartLoading />
        <ChartLoading />
      </div>
    )
  }

  const {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
  } = recharts

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <DashboardCard
        title={t('dashboard.charts.revenueTrend')}
        subtitle={t('dashboard.charts.last30Days')}
        className="lg:col-span-2"
      >
        {revenueTrend.every((d) => d.revenue === 0) ? (
          <DashboardEmpty message={t('common.noData')} />
        ) : (
          <ChartFrame>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => formatMoney(Number(v))}
                  width={72}
                />
                <Tooltip formatter={(v) => formatMoney(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  fill="#dbeafe"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartFrame>
        )}
      </DashboardCard>

      <DashboardCard
        title={t('dashboard.charts.paymentMethods')}
        subtitle={t('dashboard.charts.today')}
      >
        {paymentSlices.length === 0 ? (
          <DashboardEmpty message={t('common.noData')} />
        ) : (
          <PaymentMethodsPieChart slices={paymentSlices} />
        )}
      </DashboardCard>

      <DashboardCard
        title={t('dashboard.charts.salesByHour')}
        subtitle={t('dashboard.charts.today')}
        className="lg:col-span-3"
      >
        {hourly.every((d) => d.transactions === 0) ? (
          <DashboardEmpty message={t('common.noData')} />
        ) : (
          <ChartFrame heightClass="h-52">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                <Tooltip />
                <Bar
                  dataKey="transactions"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        )}
      </DashboardCard>
    </div>
  )
}
