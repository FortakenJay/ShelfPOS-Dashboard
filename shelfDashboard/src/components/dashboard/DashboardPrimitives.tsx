import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '#/lib/money'
import type { DashboardKpiTrend } from '#/lib/types'

export function DashboardCard({
  title,
  subtitle,
  children,
  className = '',
  id,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      className={`min-w-0 rounded-xl border-2 border-line bg-white p-5 shadow-sm hover:border-slate-300 ${className}`}
    >
      <div className="mb-4">
        <h2 className="text-[17px] font-bold text-slate-800">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  )
}

export function SectionHeading({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-[14px] text-slate-500">{description}</p>
      )}
    </div>
  )
}

function TrendBadge({
  trend,
  money = false,
  invert = false,
}: {
  trend: DashboardKpiTrend
  money?: boolean
  invert?: boolean
}) {
  const { t } = useTranslation()
  const display = money ? formatMoney(trend.value) : String(trend.value)
  const hasTrend = trend.changePct != null
  const positive = trend.changePct != null && trend.changePct >= 0
  const trendGood = invert ? !positive : positive

  return (
    <div>
      <p className="text-2xl font-extrabold tracking-tight text-slate-900">
        {display}
      </p>
      {hasTrend && (
        <p
          className={`mt-2 text-[13px] font-bold ${trendGood ? 'text-cta' : 'text-danger'}`}
        >
          {positive ? '▲' : '▼'} {Math.abs(trend.changePct!)}% {t('common.vsPrevious')}
        </p>
      )}
    </div>
  )
}

export function KpiCard({
  label,
  trend,
  money = false,
  invertTrend = false,
}: {
  label: string
  trend: DashboardKpiTrend
  money?: boolean
  invertTrend?: boolean
}) {
  return (
    <div className="rounded-xl border-2 border-line bg-white p-4 shadow-sm">
      <p className="text-[13px] font-semibold text-slate-500">{label}</p>
      <div className="mt-2">
        <TrendBadge trend={trend} money={money} invert={invertTrend} />
      </div>
    </div>
  )
}

export function DashboardEmpty({ message }: { message: string }) {
  return (
    <div className="flex min-h-[100px] items-center justify-center rounded-lg bg-slate-50 px-4 py-8 text-center text-[15px] text-slate-500">
      {message}
    </div>
  )
}

export function FooterLink({
  to,
  label,
  search,
}: {
  to: string
  label: string
  search?: Record<string, string>
}) {
  return (
    <div className="mt-4 border-t border-line pt-3 text-right">
      <Link
        to={to}
        search={search}
        className="text-[14px] font-semibold text-primary hover:underline"
      >
        {label}
      </Link>
    </div>
  )
}
