import { useTranslation } from 'react-i18next'
import type { DashboardData } from '#/lib/types'
import type { DashboardTab } from '#/lib/dashboardTabs'
import {
  DashboardCard,
  KpiCard,
  SectionHeading,
} from '#/components/dashboard/DashboardPrimitives'
import { CategoryPerformanceChart } from '#/components/dashboard/CategoryPerformanceChart'
import { ActivityAlertsSection } from '#/components/dashboard/ActivityAlertsSection'
import { DashboardHomeCharts } from '#/components/dashboard/DashboardHomeCharts'
import { EmployeeSection } from '#/components/dashboard/EmployeeSection'
import { InventoryHealthChart } from '#/components/dashboard/InventoryHealthChart'
import { InventoryManagementSection } from '#/components/dashboard/InventoryManagementSection'
import { ProductAnalyticsTables } from '#/components/dashboard/ProductAnalyticsTables'
import { SalesAnalyticsSection } from '#/components/dashboard/SalesAnalyticsSection'
import { StockMovementChart } from '#/components/dashboard/StockMovementChart'
import { TaxSummarySection } from '#/components/dashboard/TaxSummarySection'
import { Button, FullScreenSpinner } from '#/components/ui'

function KpiOverview({ kpis }: { kpis: DashboardData['kpis'] }) {
  const { t } = useTranslation()
  const cards = [
    { key: 'salesToday', label: t('dashboard.salesToday'), trend: kpis.todaySales, money: true },
    { key: 'salesMonth', label: t('dashboard.salesMonth'), trend: kpis.monthlySales, money: true },
    { key: 'txToday', label: t('dashboard.txToday'), trend: kpis.todayTransactions },
    { key: 'avgTicket', label: t('dashboard.avgTicket'), trend: kpis.avgTicketToday, money: true },
    { key: 'lowStock', label: t('dashboard.inventory.lowStock'), trend: kpis.lowStockAlerts, invertTrend: true },
    { key: 'outOfStock', label: t('dashboard.inventory.outOfStock'), trend: kpis.outOfStock, invertTrend: true },
  ] as const

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <KpiCard
          key={c.key}
          label={c.label}
          trend={c.trend}
          money={'money' in c ? c.money : false}
          invertTrend={'invertTrend' in c ? c.invertTrend : false}
        />
      ))}
    </div>
  )
}

function DashboardAnalytics({ data }: { data: DashboardData }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-8 p-6">
      <section>
        <SectionHeading
          title={t('dashboard.sections.salesAnalytics')}
          description={t('dashboard.sections.salesAnalyticsDesc')}
        />
        <SalesAnalyticsSection data={data} />
      </section>
      <section>
        <SectionHeading
          title={t('dashboard.sections.productAnalytics')}
          description={t('dashboard.sections.productAnalyticsDesc')}
        />
        <div className="mb-4">
          <DashboardCard
            title={t('dashboard.charts.categoryPerformance')}
            subtitle={t('dashboard.charts.thisMonth')}
          >
            <CategoryPerformanceChart categories={data.categoryPerformance} />
          </DashboardCard>
        </div>
        <ProductAnalyticsTables data={data} />
      </section>
      <section>
        <TaxSummarySection data={data} />
      </section>
    </div>
  )
}

export function DashboardTabContent({
  tab,
  data,
  teamLoading = false,
  teamError = false,
  onRetryTeam,
}: {
  tab: DashboardTab
  data: DashboardData
  teamLoading?: boolean
  teamError?: boolean
  onRetryTeam?: () => void
}) {
  if (tab === 'analytics') return <DashboardAnalytics data={data} />
  if (tab === 'inventory') return <DashboardInventory data={data} />
  if (tab === 'team') {
    return (
      <DashboardTeam
        data={data}
        loading={teamLoading}
        error={teamError}
        onRetry={onRetryTeam}
      />
    )
  }
  return <DashboardInicio data={data} />
}

function DashboardInicio({ data }: { data: DashboardData }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-8 p-6">
      <section>
        <SectionHeading
          title={t('dashboard.overviewTitle')}
          description={t('dashboard.profitHint')}
        />
        <KpiOverview kpis={data.kpis} />
      </section>
      <section>
        <SectionHeading
          title={t('dashboard.sections.homeCharts')}
          description={t('dashboard.sections.homeChartsDesc')}
        />
        <DashboardHomeCharts data={data} />
      </section>
      <section>
        <SectionHeading
          title={t('dashboard.sections.activityAlerts')}
          description={t('dashboard.sections.activityAlertsDesc')}
        />
        <ActivityAlertsSection data={data} />
      </section>
    </div>
  )
}

function DashboardInventory({ data }: { data: DashboardData }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-8 p-6">
      <section>
        <SectionHeading
          title={t('dashboard.sections.inventoryAnalytics')}
          description={t('dashboard.sections.inventoryAnalyticsDesc')}
        />
        <div className="mb-4 grid gap-4 lg:grid-cols-2">
          <StockMovementChart data={data.stockMovementTrend} />
          <InventoryHealthChart health={data.inventoryHealth} />
        </div>
        <InventoryManagementSection data={data} />
      </section>
    </div>
  )
}

function DashboardTeam({
  data,
  loading,
  error,
  onRetry,
}: {
  data: DashboardData
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}) {
  const { t } = useTranslation()
  if (loading) return <FullScreenSpinner />
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6">
        <p className="font-semibold text-danger">{t('errors.loadDashboard')}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        )}
      </div>
    )
  }
  return (
    <div className="space-y-8 p-6">
      <section>
        <SectionHeading
          title={t('dashboard.sections.employees')}
          description={t('dashboard.sections.employeesDesc')}
        />
        <EmployeeSection data={data} />
      </section>
    </div>
  )
}
