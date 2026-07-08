import { useTranslation } from 'react-i18next'
import { formatDateTime } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import type { DashboardData } from '#/lib/types'
import {
  DashboardCard,
  DashboardEmpty,
  FooterLink,
} from '#/components/dashboard/DashboardPrimitives'
import { Td, Th } from '#/components/ui'

export function EmployeeSection({ data }: { data: DashboardData }) {
  const { t } = useTranslation()
  const emp = data.employees

  return (
    <div className="space-y-4">
      <DashboardCard title={t('dashboard.employees.overview')}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 px-3 py-3">
            <p className="text-[12px] font-semibold text-slate-500">
              {t('dashboard.employees.total')}
            </p>
            <p className="mt-1 text-2xl font-bold">{emp.totalEmployees}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-3">
            <p className="text-[12px] font-semibold text-slate-500">
              {t('dashboard.employees.active')}
            </p>
            <p className="mt-1 text-2xl font-bold">{emp.activeEmployees}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-3">
            <p className="text-[12px] font-semibold text-slate-500">
              {t('dashboard.employees.roles')}
            </p>
            <ul className="mt-2 space-y-1 text-[14px] font-semibold">
              {emp.roleCounts.map((r) => (
                <li key={r.role}>
                  {t(`roles.${r.role}`)}: {r.count}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title={t('dashboard.employees.roster')}>
        {data.teamMembers.length === 0 ? (
          <DashboardEmpty message={t('dashboard.employees.rosterEmpty')} />
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <Th>{t('dashboard.employees.name')}</Th>
                <Th>{t('dashboard.employees.roleColumn')}</Th>
                <Th>{t('dashboard.employees.statusColumn')}</Th>
              </tr>
            </thead>
            <tbody>
              {data.teamMembers.map((member) => (
                <tr key={member.id}>
                  <Td className="font-semibold">{member.username}</Td>
                  <Td>
                    {member.role ? t(`roles.${member.role}`) : t('common.dash')}
                  </Td>
                  <Td>
                    {member.isActive
                      ? t('dashboard.employees.statusActive')
                      : t('dashboard.employees.statusInactive')}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DashboardCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardCard title={t('dashboard.employees.performance')}>
          {data.employeePerformance.length === 0 ? (
            <DashboardEmpty message={t('common.noData')} />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <Th>{t('dashboard.employees.name')}</Th>
                  <Th className="text-right">
                    {t('dashboard.employees.transactions')}
                  </Th>
                  <Th className="text-right">
                    {t('dashboard.employees.volume')}
                  </Th>
                  <Th className="text-right">
                    {t('dashboard.employees.avgTicket')}
                  </Th>
                </tr>
              </thead>
              <tbody>
                {data.employeePerformance.map((row) => (
                  <tr key={row.userId}>
                    <Td>
                      <span className="font-semibold">{row.username}</span>
                      <span className="ml-2 text-[12px] text-slate-400">
                        {t(`roles.${row.role}`)}
                      </span>
                    </Td>
                    <Td className="text-right">{row.transactions}</Td>
                    <Td className="text-right">
                      {formatMoney(row.salesVolume)}
                    </Td>
                    <Td className="text-right">
                      {formatMoney(row.avgTicket)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DashboardCard>

        <DashboardCard title={t('dashboard.employees.rolesAccess')}>
          <ul className="space-y-3">
            {data.roleSummaries.map((role) => (
              <li
                key={role.role}
                className="rounded-lg border-2 border-line px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    {t(`roles.${role.role}`)}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[13px] font-bold text-primary">
                    {role.count}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-slate-500">
                  {t(role.descriptionKey)}
                </p>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>

      <DashboardCard title={t('dashboard.employees.recentActivity')}>
        {data.recentEmployeeActivity.length === 0 ? (
          <DashboardEmpty message={t('common.noData')} />
        ) : (
          <ul className="divide-y divide-line">
            {data.recentEmployeeActivity.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap justify-between gap-2 py-3"
              >
                <div>
                  <p className="text-[14px] font-semibold">
                    {t(`audit.actions.${row.action}`, {
                      defaultValue: row.action,
                    })}
                  </p>
                  <p className="text-[13px] text-slate-500">
                    {row.username ?? t('common.dash')}
                    {row.detail ? ` · ${row.detail}` : ''}
                  </p>
                </div>
                <time className="text-[12px] text-slate-400">
                  {formatDateTime(row.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
        <FooterLink to="/audit" label={t('dashboard.viewAudit')} />
      </DashboardCard>
    </div>
  )
}
