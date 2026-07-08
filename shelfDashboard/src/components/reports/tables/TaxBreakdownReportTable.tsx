import { useTranslation } from 'react-i18next'
import { Td, Th } from '#/components/ui'
import { formatMoney } from '#/lib/money'
import type { TaxBreakdownReport } from '#/lib/reports.types'

export function TaxBreakdownReportTable({ data }: { data: TaxBreakdownReport }) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-[14px] font-semibold">
        <span>{t('reports.tax.regime')}</span>
        <span>{t(`tax.regime.${data.regime}`)}</span>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <Th>{t('reports.tax.category')}</Th>
            <Th className="text-right">{t('reports.tax.rate')}</Th>
            <Th className="text-right">{t('reports.tax.gross')}</Th>
            <Th className="text-right">{t('reports.tax.base')}</Th>
            <Th className="text-right">{t('reports.tax.iva')}</Th>
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
            <tr key={row.taxCategory}>
              <Td className="font-semibold">{t(`tax.categories.${row.taxCategory}`)}</Td>
              <Td className="text-right">{Math.round(row.rate * 100)}%</Td>
              <Td className="text-right">{formatMoney(row.gross)}</Td>
              <Td className="text-right">{formatMoney(row.base)}</Td>
              <Td className="text-right font-bold">{formatMoney(row.iva)}</Td>
            </tr>
          ))}
          <tr className="bg-slate-50">
            <Td className="font-extrabold" colSpan={2}>
              {t('common.total')}
            </Td>
            <Td className="text-right font-extrabold">{formatMoney(data.totalGross)}</Td>
            <Td className="text-right font-extrabold">{formatMoney(data.totalBase)}</Td>
            <Td className="text-right font-extrabold">{formatMoney(data.totalIva)}</Td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
