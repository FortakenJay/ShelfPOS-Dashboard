import { useTranslation } from 'react-i18next'
import { Td, Th } from '#/components/ui'
import { formatMoney } from '#/lib/money'
import type { TopProductRow } from '#/lib/reports.types'

export function TopProductsReportTable({ rows }: { rows: TopProductRow[] }) {
  const { t } = useTranslation()

  return (
    <table className="w-full">
      <thead>
        <tr>
          <Th>{t('reports.top.product')}</Th>
          <Th>{t('products.barcode')}</Th>
          <Th className="text-right">{t('reports.top.qty')}</Th>
          <Th className="text-right">{t('reports.top.revenue')}</Th>
          <Th className="text-right">{t('reports.top.profit')}</Th>
          <Th className="text-right">{t('reports.top.margin')}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <Td colSpan={6} className="py-6 text-center text-slate-500">
              {t('common.noData')}
            </Td>
          </tr>
        )}
        {rows.map((row) => (
          <tr key={row.productId}>
            <Td className="font-semibold">{row.name}</Td>
            <Td className="font-mono text-[14px]">{row.barcode}</Td>
            <Td className="text-right font-bold">{row.quantity}</Td>
            <Td className="text-right">{formatMoney(row.revenue)}</Td>
            <Td className="text-right">{formatMoney(row.profit)}</Td>
            <Td className="text-right">
              {row.marginPct != null ? `${row.marginPct}%` : t('common.dash')}
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
