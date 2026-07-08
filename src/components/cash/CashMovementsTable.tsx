import { useTranslation } from 'react-i18next'
import { Td, Th } from '#/components/ui'
import { formatDateTime } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import type { CashMovementRow } from '#/lib/types'

type CashMovementType = 'opening_float' | 'cash_in' | 'cash_out'

function isCashMovementType(type: string | null): type is CashMovementType {
  return type === 'opening_float' || type === 'cash_in' || type === 'cash_out'
}

export function CashMovementsTable({
  movements,
}: {
  movements: CashMovementRow[]
}) {
  const { t } = useTranslation()

  const movementLabel = (type: string | null): string => {
    if (isCashMovementType(type)) return t(`cash.types.${type}`)
    return type ?? t('common.dash')
  }

  return (
    <section className="rounded-lg border-2 border-line bg-white">
      <h2 className="border-b border-line px-5 py-4 text-lg font-bold">
        {t('cash.movements')}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr>
              <Th>{t('common.date')}</Th>
              <Th>{t('cash.type')}</Th>
              <Th>{t('cash.reason')}</Th>
              <Th>{t('cierre.closedBy')}</Th>
              <Th className="text-right">{t('pos.amount')}</Th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="border-b border-line px-4 py-8 text-center text-[15px] text-slate-500"
                >
                  {t('common.noData')}
                </td>
              </tr>
            )}
            {movements.map((m) => (
              <tr key={m.id}>
                <Td className="whitespace-nowrap">{formatDateTime(m.created_at)}</Td>
                <Td className="font-semibold">{movementLabel(m.type)}</Td>
                <Td>{m.reason?.trim() || t('common.dash')}</Td>
                <Td>{m.username}</Td>
                <Td
                  className={`text-right font-bold tabular-nums ${
                    m.type === 'cash_out' ? 'text-danger' : ''
                  }`}
                >
                  {m.type === 'cash_out' ? '−' : ''}
                  {formatMoney(m.amount ?? 0)}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
