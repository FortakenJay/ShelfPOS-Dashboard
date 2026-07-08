import { calendarWeekStartLocal, monthStartLocal, todayLocal } from '#/lib/dates'
import type { ReportPeriodPreset } from '#/lib/reports.types'
import type { DateRange } from '#/lib/types'

export function presetToday(): DateRange {
  const today = todayLocal()
  return { from: today, to: today }
}

export function presetWeek(): DateRange {
  return { from: calendarWeekStartLocal(), to: todayLocal() }
}

export function presetMonth(): DateRange {
  const today = todayLocal()
  return { from: monthStartLocal(0), to: today }
}

export function rangeForReportPeriod(period: ReportPeriodPreset): DateRange {
  switch (period) {
    case 'today':
      return presetToday()
    case 'week':
      return presetWeek()
    case 'month':
      return presetMonth()
  }
}
