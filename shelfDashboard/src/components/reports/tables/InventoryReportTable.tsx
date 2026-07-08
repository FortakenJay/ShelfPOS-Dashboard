import { useTranslation } from 'react-i18next'
import { Td, Th } from '#/components/ui'
import { formatMoney } from '#/lib/money'
import type { InventoryReport } from '#/lib/reports.types'

export function InventoryReportTable({ data }: { data: InventoryReport }) {
  const { t } = useTranslation()

  return (
    <table className="w-full">
      <thead>
        <tr>
          <Th>{t('products.name')}</Th>
          <Th>{t('products.category')}</Th>
          <Th className="text-right">{t('products.price')}</Th>
          <Th className="text-right">{t('products.stock')}</Th>
          <Th className="text-right">{t('reports.inventory.value')}</Th>
        </tr>
      </thead>
      <tbody>
        {data.rows.length === 0 && (
          <tr>
            <Td colSpan={5} className="py-6 text-center text-slate-500">
              {t('common.noData')}
            </Td>
          </tr>
        )}
        {data.rows.map((row) => (
          <tr key={row.id}>
            <Td className="font-semibold">{row.name}</Td>
            <Td>{row.category ?? t('common.dash')}</Td>
            <Td className="text-right">{formatMoney(row.price)}</Td>
            <Td
              className={`text-right font-bold ${
                row.stock <= 0
                  ? 'text-danger'
                  : row.stock <= row.threshold
                    ? 'text-warning'
                    : ''
              }`}
            >
              {row.stock}
            </Td>
            <Td className="text-right">{formatMoney(row.value)}</Td>
          </tr>
        ))}
        <tr className="bg-slate-50">
          <Td colSpan={4} className="font-extrabold">
            {t('reports.inventory.totalValue')}
          </Td>
          <Td className="text-right text-[17px] font-extrabold">
            {formatMoney(data.totalValue)}
          </Td>
        </tr>
      </tbody>
    </table>
  )
}
