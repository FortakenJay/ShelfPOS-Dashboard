import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '#/lib/dates'
import { dashboardAlertSearch } from '#/lib/dashboardAlertSearch'
import { parseSaleActivityTotal } from '#/lib/dashboard-activity'
import { panelAlertSeverityClass } from '#/lib/dashboardAlertSeverity'
import { formatMoney } from '#/lib/money'
import type { DashboardData } from '#/lib/types'
import {
  DashboardCard,
  DashboardEmpty,
  FooterLink,
} from '#/components/dashboard/DashboardPrimitives'

export function ActivityAlertsSection({
  data,
}: {
  data: DashboardData
}) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <DashboardCard title={t('dashboard.activity.title')}>
        {data.recentActivity.length === 0 ? (
          <DashboardEmpty message={t('common.noData')} />
        ) : (
          <ul className="divide-y divide-line">
            {data.recentActivity.map((item) => {
              const saleTotal =
                item.kind === 'sale' && item.detail
                  ? parseSaleActivityTotal(item.detail)
                  : null
              const content = (
                <>
                  <div>
                    <p className="text-[14px] font-semibold">
                      {t(item.messageKey, { defaultValue: item.messageKey })}
                      {saleTotal != null ? ` · ${formatMoney(saleTotal)}` : ''}
                    </p>
                    <p className="text-[13px] text-slate-500">
                      {item.username ?? t('common.dash')}
                      {item.kind !== 'sale' && item.detail
                        ? ` · ${item.detail}`
                        : ''}
                    </p>
                  </div>
                  <time className="text-[12px] text-slate-400">
                    {formatDateTime(item.createdAt)}
                  </time>
                </>
              )

              return (
                <li key={item.id}>
                  {item.linkTo ? (
                    <Link
                      to={item.linkTo}
                      className="flex flex-wrap justify-between gap-2 py-3 hover:bg-slate-50"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex flex-wrap justify-between gap-2 py-3">
                      {content}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <FooterLink to="/audit" label={t('dashboard.viewAudit')} />
      </DashboardCard>

      <DashboardCard title={t('dashboard.alerts.title')} id="alerts">
        {data.alerts.length === 0 ? (
          <DashboardEmpty message={t('dashboard.alerts.none')} />
        ) : (
          <ul className="space-y-2">
            {data.alerts.map((alert) => (
              <li key={alert.kind}>
                {alert.linkTo ? (
                  <Link
                    to={alert.linkTo}
                    search={dashboardAlertSearch(alert)}
                    className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 ${panelAlertSeverityClass(alert.severity)}`}
                  >
                    <span className="text-[14px] font-semibold">
                      {t(alert.messageKey, { count: alert.count })}
                    </span>
                    <span className="font-bold">{alert.count}</span>
                  </Link>
                ) : (
                  <div
                    className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 ${panelAlertSeverityClass(alert.severity)}`}
                  >
                    <span className="font-semibold">
                      {t(alert.messageKey, { count: alert.count })}
                    </span>
                    <span className="font-bold">{alert.count}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  )
}
