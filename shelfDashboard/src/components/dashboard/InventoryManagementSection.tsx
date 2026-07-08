import { useTranslation } from 'react-i18next'
import type { DashboardData, InventoryProductRow } from '#/lib/types'
import {
  DashboardCard,
  DashboardEmpty,
  FooterLink,
} from '#/components/dashboard/DashboardPrimitives'
import { Td, Th } from '#/components/ui'
import { formatMoney } from '#/lib/money'

const STATUS_STYLES: Record<InventoryProductRow['status'], string> = {
  healthy: 'bg-cta/10 text-cta',
  low: 'bg-amber-100 text-amber-900',
  critical: 'bg-danger/10 text-danger',
  negative: 'bg-danger/10 text-danger',
}

function StatusBadge({
  status,
}: {
  status: InventoryProductRow['status']
}) {
  const { t } = useTranslation()
  const key =
    status === 'negative'
      ? 'negative'
      : status === 'critical'
        ? 'critical'
        : status === 'low'
          ? 'low'
          : 'healthy'
  return (
    <span
      className={`inline-block rounded-md px-2 py-1 text-[12px] font-bold ${STATUS_STYLES[status]}`}
    >
      {t(`dashboard.stockStatus.${key}`)}
    </span>
  )
}

function InventoryProductTable({
  title,
  rows,
  footerLabel,
}: {
  title: string
  rows: InventoryProductRow[]
  footerLabel?: string
}) {
  const { t } = useTranslation()

  return (
    <DashboardCard title={title}>
      {rows.length === 0 ? (
        <DashboardEmpty message={t('common.noData')} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr>
                <Th>{t('products.name')}</Th>
                <Th>{t('dashboard.lowStock.sku')}</Th>
                <Th className="text-right">{t('products.stock')}</Th>
                <Th>{t('dashboard.lowStock.status')}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.productId}>
                  <Td className="font-semibold">{row.name}</Td>
                  <Td className="font-mono text-[13px]">{row.sku}</Td>
                  <Td className="text-right font-bold">{row.stock}</Td>
                  <Td>
                    <StatusBadge status={row.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {footerLabel && (
        <FooterLink
          to="/dashboard"
          search={{ tab: 'inventory' }}
          label={footerLabel}
        />
      )}
    </DashboardCard>
  )
}

export function InventoryManagementSection({
  data,
}: {
  data: DashboardData
}) {
  const { t } = useTranslation()
  const inv = data.inventory

  const summary = [
    [t('dashboard.inventory.totalProducts'), String(inv.totalProducts)],
    [t('dashboard.inventory.activeProducts'), String(inv.activeProducts)],
    [t('dashboard.inventory.lowStock'), String(inv.lowStock)],
    [t('dashboard.inventory.outOfStock'), String(inv.outOfStock)],
    [t('dashboard.inventory.costValue'), formatMoney(inv.costValue)],
    [t('dashboard.inventory.retailValue'), formatMoney(inv.retailValue)],
  ] as const

  return (
    <div className="space-y-4">
      <DashboardCard title={t('dashboard.inventory.title')}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {summary.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 px-3 py-3">
              <p className="text-[12px] font-semibold text-slate-500">{label}</p>
              <p className="mt-1 text-[18px] font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        <FooterLink
          to="/dashboard"
          search={{ tab: 'inventory' }}
          label={t('dashboard.viewAllProducts')}
        />
      </DashboardCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <InventoryProductTable
          title={t('dashboard.lowStock.title')}
          rows={data.lowStockProducts}
          footerLabel={t('dashboard.viewAllLowStock')}
        />
        <InventoryProductTable
          title={t('dashboard.outOfStock.title')}
          rows={data.outOfStockProducts}
          footerLabel={t('dashboard.viewOutOfStock')}
        />
      </div>

      <InventoryProductTable
        title={t('dashboard.recentInventory.title')}
        rows={data.recentlyUpdatedInventory}
        footerLabel={t('dashboard.viewAllProducts')}
      />
    </div>
  )
}
