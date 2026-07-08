import i18n from '#/lib/i18n'
import type { DateRange } from '#/lib/types'

const TZ = 'America/Costa_Rica'

const TODAY_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: TZ })
const MONTH_PARTS_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
})
const WEEKDAY_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  weekday: 'short',
})

export function todayLocal(): string {
  return TODAY_FMT.format(new Date())
}

export function daysAgoLocal(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return TODAY_FMT.format(d)
}

export function lastDayOfPreviousMonthLocal(): string {
  const [y, m] = monthStartLocal(0).split('-').map(Number)
  const lastPrev = new Date(Date.UTC(y, m - 1, 0, 18, 0, 0))
  return TODAY_FMT.format(lastPrev)
}

export function monthStartLocal(offsetMonths = 0): string {
  const parts = MONTH_PARTS_FMT.formatToParts(new Date())
  let year = Number(parts.find((p) => p.type === 'year')?.value)
  let month =
    Number(parts.find((p) => p.type === 'month')?.value) - 1 - offsetMonths
  while (month < 0) {
    month += 12
    year -= 1
  }
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

/** Inclusive local-day bounds matching SQLite sync format (`YYYY-MM-DD HH:mm:ss`). */
export function dayBounds(date: string): { from: string; to: string } {
  return { from: `${date} 00:00:00`, to: `${date} 23:59:59` }
}

export function rangeBounds(from: string, to: string): { from: string; to: string } {
  return { from: `${from} 00:00:00`, to: `${to} 23:59:59` }
}

/** Bounds with optional HH:mm (matches POS SQLite timestamps). */
export function rangeBoundsFromDateRange(range: DateRange): { from: string; to: string } {
  const fromTime = range.fromTime ?? '00:00'
  const toTime = range.toTime ?? '23:59'
  return {
    from: `${range.from} ${fromTime}:00`,
    to: `${range.to} ${toTime}:59`,
  }
}

/** Normalize SQLite / ISO timestamps for lexicographic Supabase TEXT filters. */
function normalizeDbTimestamp(value: string): string {
  return value.includes('T') ? value.replace('T', ' ') : value
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-CR', {
    timeZone: TZ,
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

/** POS report/receipt timestamps: dd/MM/yyyy HH:mm */
export function formatReportTimestamp(
  value: string | null | undefined,
  withTime = true,
): string {
  if (!value) return '—'
  const normalized = value.includes('T') ? value.replace('T', ' ') : value
  const [datePart, timePart] = normalized.split(' ')
  const [y, m, d] = datePart.split('-')
  if (!y || !m || !d) return value
  const date = `${d}/${m}/${y}`
  if (withTime && timePart) return `${date} ${timePart.slice(0, 5)}`
  return date
}

const REPORT_NOW_FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatReportNow(): string {
  return REPORT_NOW_FMT.format(new Date()).replace(',', '')
}

/** Parse SQLite `YYYY-MM-DD HH:MM:SS` or ISO timestamps to epoch ms. */
export function parseDbTimestamp(value: string | null | undefined): number {
  if (!value) return NaN
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  return new Date(normalized).getTime()
}

/** Local calendar date `YYYY-MM-DD` from a synced timestamp string. */
export function dbTimestampDay(value: string): string {
  return value.slice(0, 10)
}

/** Hour 0–23 from a synced timestamp string (local wall clock as stored). */
export function dbTimestampHour(value: string): number {
  const normalized = normalizeDbTimestamp(value)
  const match = normalized.match(/ (\d{2}):/)
  return match ? Number(match[1]) : 0
}

export function daysInRange(from: string, to: string): string[] {
  const days: string[] = []
  const cursor = new Date(`${from}T12:00:00`)
  const end = new Date(`${to}T12:00:00`)
  while (cursor <= end) {
    days.push(TODAY_FMT.format(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

/** Monday of the current calendar week in Costa Rica (matches POS Reports). */
export function calendarWeekStartLocal(): string {
  const today = todayLocal()
  const weekday = WEEKDAY_FMT.format(new Date(`${today}T12:00:00`))
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  const dow = map[weekday] ?? 0
  const mondayOffset = dow === 0 ? 6 : dow - 1
  return daysAgoLocal(mondayOffset)
}

export function formatRelativeTime(
  iso: string | null | undefined,
  now = Date.now(),
): string {
  if (!iso) return i18n.t('status.noActivity')
  const t = parseDbTimestamp(iso)
  if (Number.isNaN(t)) return iso
  const diffMs = now - t
  if (diffMs < 0) return i18n.t('relative.justNow')
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return i18n.t('relative.justNow')
  const min = Math.floor(sec / 60)
  if (min < 60) return i18n.t('relative.minutes', { count: min })
  const hr = Math.floor(min / 60)
  if (hr < 24) return i18n.t('relative.hours', { count: hr })
  const days = Math.floor(hr / 24)
  return i18n.t('relative.days', { count: days })
}
