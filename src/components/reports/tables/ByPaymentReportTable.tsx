import { useTranslation } from 'react-i18next'
import { Td, Th } from '#/components/ui'
import { formatMoney } from '#/lib/money'
import type { PaymentMethodReport } from '#/lib/reports.types'

export function ByPaymentReportTable({ data }: { data: PaymentMethodReport }) {
  const { t } = useTranslation()
  const rows: [string, number, number][] = [
    [t('pos.methods.cash'), data.cash, data.countCash],
    [t('pos.methods.card'), data.card, data.countCard],
    [t('pos.methods.sinpe'), data.sinpe, data.countSinpe],
  ]

  return (
    <table className="w-full">
      <thead>
        <tr>
          <Th>{t('reports.byPayment.method')}</Th>
          <Th className="text-right">{t('reports.byPayment.amount')}</Th>
          <Th className="text-right">{t('reports.byPayment.count')}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, amount, count]) => (
          <tr key={label}>
            <Td className="font-semibold">{label}</Td>
            <Td className="text-right">{formatMoney(amount)}</Td>
            <Td className="text-right">{count}</Td>
          </tr>
        ))}
        <tr className="bg-slate-50">
          <Td className="font-extrabold">{t('common.total')}</Td>
          <Td className="text-right text-[17px] font-extrabold">
            {formatMoney(data.total)}
          </Td>
          <Td className="text-right font-extrabold">
            {data.countCash + data.countCard + data.countSinpe}
          </Td>
        </tr>
      </tbody>
    </table>
  )
}
