import { SaleFacturaPdfButton } from '#/components/reports/SaleFacturaPdfButton'
import { useTranslation } from 'react-i18next'
import { Td, Th } from '#/components/ui'
import { formatDateTime } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import type { TransactionLogReport } from '#/lib/reports.types'

export function TransactionLogReportTable({ data }: { data: TransactionLogReport }) {
  const { t } = useTranslation()

  return (
    <table className="w-full">
      <thead>
        <tr>
          <Th>{t('common.date')}</Th>
          <Th>{t('reports.transactionLog.receipt')}</Th>
          <Th>{t('reports.transactionLog.cashier')}</Th>
          <Th>{t('reports.transactionLog.customer')}</Th>
          <Th>{t('reports.transactionLog.payment')}</Th>
          <Th className="text-right">{t('reports.transactionLog.discount')}</Th>
          <Th className="text-right">{t('common.total')}</Th>
          <Th className="text-right">{t('reports.facturaPdf.actions')}</Th>
        </tr>
      </thead>
      <tbody>
        {data.rows.length === 0 && (
          <tr>
            <Td colSpan={8} className="py-6 text-center text-slate-500">
              {t('common.noData')}
            </Td>
          </tr>
        )}
        {data.rows.map((row) => (
          <tr key={row.saleId}>
            <Td className="font-mono text-[14px]">{formatDateTime(row.createdAt)}</Td>
            <Td className="font-mono font-bold">
              {row.consecutivo ?? `#${row.saleId}`}
            </Td>
            <Td>{row.cashier}</Td>
            <Td>{row.customerName ?? t('common.dash')}</Td>
            <Td>
              {row.payments.map((p) => t(`pos.methods.${p.method}`)).join(', ') ||
                t('common.dash')}
            </Td>
            <Td className="text-right">
              {row.discountTotal > 0 ? formatMoney(row.discountTotal) : t('common.dash')}
            </Td>
            <Td className="text-right font-bold">{formatMoney(row.total)}</Td>
            <Td className="text-right">
              <div className="inline-flex py-0.5 pl-2">
                <SaleFacturaPdfButton saleId={row.saleId} consecutivo={row.consecutivo} />
              </div>
            </Td>
          </tr>
        ))}
        {data.rows.length > 0 && (
          <tr className="bg-slate-50">
            <Td colSpan={6} className="font-extrabold">
              {t('common.total')} ({data.txCount})
            </Td>
            <Td className="text-right text-[17px] font-extrabold">
              {formatMoney(data.totalRevenue)}
            </Td>
            <Td />
          </tr>
        )}
      </tbody>
    </table>
  )
}
