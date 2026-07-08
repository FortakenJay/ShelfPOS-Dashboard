import { useTranslation } from 'react-i18next'
import { formatMoney } from '#/lib/money'
import type { DashboardData } from '#/lib/types'
import {
  DashboardCard,
  FooterLink,
} from '#/components/dashboard/DashboardPrimitives'

export function TaxSummarySection({
  data,
}: {
  data: DashboardData
}): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <DashboardCard title={t('dashboard.tax.title')}>
      <p className="mb-3 text-[13px] text-slate-500">
        {t('reports.tax.regime')}: {t(`tax.regime.${data.taxSummary.regime}`)}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          [t('dashboard.tax.taxable'), formatMoney(data.taxableSales)],
          [t('dashboard.tax.ivaCollected'), formatMoney(data.taxSummary.totalIva)],
          [t('dashboard.tax.monthlyLiability'), formatMoney(data.taxSummary.totalIva)],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg bg-slate-50 px-3 py-3">
            <p className="text-[12px] font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-[18px] font-bold">{value}</p>
          </div>
        ))}
      </div>
      <FooterLink
        to="/reports"
        label={t('dashboard.viewTaxReport')}
        search={{ type: 'taxBreakdown', period: 'month' }}
      />
    </DashboardCard>
  )
}
