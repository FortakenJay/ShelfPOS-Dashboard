import { useTranslation } from 'react-i18next'
import { formatMoney } from '#/lib/money'
import type { DashboardData, ProductPerformanceRow } from '#/lib/types'
import {
  DashboardCard,
  DashboardEmpty,
} from '#/components/dashboard/DashboardPrimitives'
import { Td, Th } from '#/components/ui'

function ProductPerformanceTable({
  title,
  rows,
  showProfit = true,
}: {
  title: string
  rows: ProductPerformanceRow[]
  showProfit?: boolean
}): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <DashboardCard title={title}>
      {rows.length === 0 ? (
        <DashboardEmpty message={t('common.noData')} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr>
                <Th>{t('dashboard.product')}</Th>
                <Th className="text-right">{t('dashboard.topProducts.units')}</Th>
                <Th className="text-right">{t('dashboard.topProducts.revenue')}</Th>
                {showProfit && (
                  <Th className="text-right">{t('dashboard.topProducts.profit')}</Th>
                )}
                <Th className="text-right">{t('dashboard.stock')}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.productId}>
                  <Td className="font-semibold">{row.name}</Td>
                  <Td className="text-right font-bold">{row.unitsSold}</Td>
                  <Td className="text-right">{formatMoney(row.revenue)}</Td>
                  {showProfit && (
                    <Td className="text-right">{formatMoney(row.profit)}</Td>
                  )}
                  <Td className="text-right">{row.stock}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  )
}

export function ProductAnalyticsTables({
  data,
}: {
  data: DashboardData
}): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ProductPerformanceTable
        title={t('dashboard.topProducts.title')}
        rows={data.topProducts}
      />
      <ProductPerformanceTable
        title={t('dashboard.slowProducts.title')}
        rows={data.slowProducts}
      />
      <ProductPerformanceTable
        title={t('dashboard.worstSellers.title')}
        rows={data.worstSellers}
      />
      <ProductPerformanceTable
        title={t('dashboard.recentProducts.title')}
        rows={data.recentlyAddedProducts}
        showProfit={false}
      />
    </div>
  )
}
