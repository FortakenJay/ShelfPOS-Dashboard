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
import { SalesTrendChart } from '#/components/dashboard/SalesTrendChart'
import { TransactionTrendChart } from '#/components/dashboard/TransactionTrendChart'
import { useRechartsModule } from '#/hooks/useRechartsModule'

export function SalesAnalyticsSection({
  data,
}: {
  data: DashboardData
}): React.JSX.Element {
  const { t } = useTranslation()
  const recharts = useRechartsModule()

  const hourly = data.salesByHour.map((d) => ({
    hour: `${String(d.hour).padStart(2, '0')}:00`,
    transactions: d.transactions,
  }))

  const paymentSlices = [
    { name: t('payment.cash'), value: data.paymentToday.cash },
    { name: t('payment.card'), value: data.paymentToday.card },
    { name: t('payment.sinpe'), value: data.paymentToday.sinpe },
  ].filter((s) => s.value > 0)

  const hourlyEmpty = hourly.every((d) => d.transactions === 0)

  let hourlyChart: React.JSX.Element
  if (hourlyEmpty) {
    hourlyChart = <DashboardEmpty message={t('common.noData')} />
  } else if (!recharts) {
    hourlyChart = <ChartLoading />
  } else {
    const { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } =
      recharts
    hourlyChart = (
      <ChartFrame heightClass="h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
            <Tooltip />
            <Bar dataKey="transactions" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardCard
          title={t('dashboard.charts.revenueTrend')}
          subtitle={t('dashboard.charts.last30Days')}
        >
          <SalesTrendChart data={data.salesTrend} />
        </DashboardCard>
        <DashboardCard
          title={t('dashboard.charts.transactionTrend')}
          subtitle={t('dashboard.charts.last30Days')}
        >
          <TransactionTrendChart data={data.salesTrend} />
        </DashboardCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardCard
          title={t('dashboard.charts.salesByHour')}
          subtitle={t('dashboard.charts.today')}
          className="xl:col-span-2"
        >
          {hourlyChart}
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
      </div>

      <DashboardCard
        title={t('dashboard.paymentsMonth')}
        subtitle={t('dashboard.charts.thisMonth')}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            [t('payment.cash'), data.paymentMonth.cash, data.paymentMonth.cashCount],
            [t('payment.card'), data.paymentMonth.card, data.paymentMonth.cardCount],
            [t('payment.sinpe'), data.paymentMonth.sinpe, data.paymentMonth.sinpeCount],
          ].map(([label, amount, count]) => (
            <div key={String(label)} className="rounded-lg bg-slate-50 px-3 py-3">
              <p className="text-[12px] font-semibold text-slate-500">{label}</p>
              <p className="mt-1 text-[18px] font-bold">{formatMoney(Number(amount))}</p>
              <p className="mt-1 text-[12px] text-slate-500">
                {count} {t('dashboard.transactions')}
              </p>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  )
}
