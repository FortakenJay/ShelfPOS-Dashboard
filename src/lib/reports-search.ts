import { rangeForReportPeriod } from '#/lib/dateRangePresets'
import type { ReportPeriodPreset, ReportType } from '#/lib/reports.types'
import type { DateRange } from '#/lib/types'

const REPORT_TYPES: ReportType[] = [
  'summary',
  'byPayment',
  'topProducts',
  'inventory',
  'taxBreakdown',
  'transactionLog',
  'itemizedSales',
]

const PERIOD_PRESETS: ReportPeriodPreset[] = ['today', 'week', 'month']

export type ReportSearch = {
  type?: ReportType
  period?: ReportPeriodPreset
  from?: string
  to?: string
  fromTime?: string
  toTime?: string
  page?: number
  pageSize?: number
}

const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const LOCAL_TIME_RE = /^\d{2}:\d{2}$/
const DEFAULT_INVENTORY_PAGE_SIZE = 50

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.trunc(n)
}

export function validateReportSearch(search: Record<string, unknown>): ReportSearch {
  return {
    type: search.type as ReportType | undefined,
    period: search.period as ReportPeriodPreset | undefined,
    from: typeof search.from === 'string' ? search.from : undefined,
    to: typeof search.to === 'string' ? search.to : undefined,
    fromTime: typeof search.fromTime === 'string' ? search.fromTime : undefined,
    toTime: typeof search.toTime === 'string' ? search.toTime : undefined,
    page:
      search.page != null ? parsePositiveInt(search.page, 1) : undefined,
    pageSize:
      search.pageSize != null
        ? parsePositiveInt(search.pageSize, DEFAULT_INVENTORY_PAGE_SIZE)
        : undefined,
  }
}

export function parseReportSearch(search: ReportSearch): {
  type: ReportType
  range: DateRange
  inventoryPage: number
  inventoryPageSize: number
} {
  const type =
    search.type && REPORT_TYPES.includes(search.type) ? search.type : 'summary'

  let range: DateRange
  if (
    search.from &&
    search.to &&
    LOCAL_DATE_RE.test(search.from) &&
    LOCAL_DATE_RE.test(search.to)
  ) {
    range = { from: search.from, to: search.to }
    if (search.fromTime && LOCAL_TIME_RE.test(search.fromTime)) {
      range.fromTime = search.fromTime
    }
    if (search.toTime && LOCAL_TIME_RE.test(search.toTime)) {
      range.toTime = search.toTime
    }
  } else {
    const period =
      search.period && PERIOD_PRESETS.includes(search.period) ? search.period : 'today'
    range = rangeForReportPeriod(period)
  }

  return {
    type,
    range,
    inventoryPage: search.page ?? 1,
    inventoryPageSize: search.pageSize ?? DEFAULT_INVENTORY_PAGE_SIZE,
  }
}

export function reportSearchFromRange(
  type: ReportType,
  range: DateRange,
  current?: Pick<ReportSearch, 'page' | 'pageSize'>,
): ReportSearch {
  const period = periodFromRange(range)
  const search: ReportSearch = period
    ? { type, period }
    : { type, from: range.from, to: range.to }
  if (!period && range.fromTime) search.fromTime = range.fromTime
  if (!period && range.toTime) search.toTime = range.toTime
  if (type === 'inventory') {
    search.page = current?.page ?? 1
    search.pageSize = current?.pageSize ?? DEFAULT_INVENTORY_PAGE_SIZE
  }
  return search
}

export function searchForReportType(
  type: ReportType,
  range: DateRange,
  pageSize = DEFAULT_INVENTORY_PAGE_SIZE,
): ReportSearch {
  const usesTime = type === 'transactionLog' || type === 'itemizedSales'
  const nextRange = usesTime ? range : { from: range.from, to: range.to }
  return reportSearchFromRange(
    type,
    nextRange,
    type === 'inventory' ? { page: 1, pageSize } : undefined,
  )
}

function periodFromRange(range: DateRange): ReportPeriodPreset | undefined {
  for (const p of PERIOD_PRESETS) {
    const preset = rangeForReportPeriod(p)
    if (
      preset.from === range.from &&
      preset.to === range.to &&
      !range.fromTime &&
      !range.toTime
    ) {
      return p
    }
  }
  return undefined
}

function inventoryTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function clampInventoryPage(page: number, knownTotal: number, pageSize: number): number {
  const safePage = Math.max(1, page)
  if (knownTotal <= 0) return safePage
  return Math.min(safePage, inventoryTotalPages(knownTotal, pageSize))
}
