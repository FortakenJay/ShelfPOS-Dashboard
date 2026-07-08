import {
  dayBounds,
  daysAgoLocal,
  daysInRange,
  dbTimestampDay,
  dbTimestampHour,
  lastDayOfPreviousMonthLocal,
  monthStartLocal,
  rangeBounds,
  todayLocal,
} from '#/lib/dates'
import type { QueryClient } from '@tanstack/react-query'
import {
  buildDashboardAlerts,
  buildRecentActivity,
} from '#/lib/dashboard-activity'
import type { PosUserRow } from '#/lib/dashboard-employees'
import {
  buildEmployeeOverviewFromPosUsers,
  EMPTY_DASHBOARD_TEAM,
  employeePerformanceFromSales,
  posUserRoleMap,
  posUserUsernameMap,
  recentEmployeeActivity,
  roleSummariesFromPosUsers,
  teamMembersFromPosUsers,
} from '#/lib/dashboard-employees'
import { isHiddenOperatorUsername } from '#/lib/hidden-operator'
import {
  inventoryBundleFromProducts,
  inventoryKpiPriorCounts,
} from '#/lib/dashboard-inventory'
import { round2 } from '#/lib/money'
import { buildTaxBreakdownFromLineItems } from '#/lib/tax-breakdown'
import type { TaxBreakdownReport } from '#/lib/reports.types'
import { getSupabase } from '#/lib/supabase'
import { fetchAllPages, fetchInChunks } from '#/lib/supabase-page'
import { DASHBOARD_PRODUCTS_STALE_MS, DASHBOARD_STALE_MS, QUERY_GC_MS } from '#/lib/stores'
import type { StoreId } from '#/lib/stores'
import type {
  AuditRow,
  CategoryPerformanceRow,
  DashboardData,
  DashboardKpiTrend,
  DashboardStockMovementPoint,
  DashboardTeamData,
  PaymentMethodReport,
  ProductPerformanceRow,
  SalesByHourPoint,
  SalesTrendPoint,
} from '#/lib/types'

function kpiTrend(current: number, previous: number): DashboardKpiTrend {
  const value = round2(current)
  const previousValue = round2(previous)
  if (previousValue === 0) {
    return { value, previousValue, changePct: current > 0 ? 100 : null }
  }
  return {
    value,
    previousValue,
    changePct: round2(((current - previousValue) / previousValue) * 100),
  }
}

type SaleRow = {
  id: number
  user_id: number | null
  total: number | null
  discount_total?: number | null
  created_at?: string
}
type SalePaymentRow = { sale_id: number | null; method: string | null; amount: number | null }
type ProductLookupRow = {
  id: number
  name: string | null
  barcode: string | null
  stock: number | null
  stock_threshold: number | null
  price: number | null
  cost_price: number | null
  category: string | null
  deleted_at: string | null
  updated_at: string | null
  created_at: string | null
}

const DASHBOARD_CHUNK_SIZE = 500

async function salesInRange(
  storeId: StoreId,
  from: string,
  to: string,
): Promise<SaleRow[]> {
  return fetchAllPages(async (offset, limit) => {
    const { data, error } = await getSupabase()
      .from('sales')
      .select('id, user_id, total, discount_total, created_at')
      .eq('store_id', storeId)
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data
  })
}

function summarizeSales(
  rows: { total: number | null; discount_total?: number | null }[],
) {
  const txCount = rows.length
  const totalRevenue = round2(rows.reduce((s, r) => s + (r.total ?? 0), 0))
  const discountTotal = round2(
    rows.reduce((s, r) => s + (r.discount_total ?? 0), 0),
  )
  const avgTicket = txCount > 0 ? round2(totalRevenue / txCount) : 0
  return { txCount, totalRevenue, avgTicket, discountTotal }
}

async function paymentsForSaleIds(
  storeId: StoreId,
  saleIds: number[],
): Promise<SalePaymentRow[]> {
  if (saleIds.length === 0) {
    return []
  }

  return fetchInChunks(saleIds, DASHBOARD_CHUNK_SIZE, async (chunk) => {
    const { data, error } = await getSupabase()
      .from('sale_payments')
      .select('sale_id, method, amount')
      .eq('store_id', storeId)
      .in('sale_id', chunk)
    if (error) throw error
    return data
  })
}

function summarizePayments(
  pays: SalePaymentRow[],
  onlySaleIds?: Set<number>,
): PaymentMethodReport {
  const report: PaymentMethodReport = {
    cash: 0,
    card: 0,
    sinpe: 0,
    cashCount: 0,
    cardCount: 0,
    sinpeCount: 0,
    total: 0,
  }
  const cashSales = new Set<number>()
  const cardSales = new Set<number>()
  const sinpeSales = new Set<number>()
  for (const p of pays) {
    const saleId = Number(p.sale_id)
    if (onlySaleIds && !onlySaleIds.has(saleId)) continue
    const amt = p.amount ?? 0
    report.total = round2(report.total + amt)
    if (p.method === 'cash') {
      report.cash = round2(report.cash + amt)
      cashSales.add(saleId)
    } else if (p.method === 'card') {
      report.card = round2(report.card + amt)
      cardSales.add(saleId)
    } else if (p.method === 'sinpe') {
      report.sinpe = round2(report.sinpe + amt)
      sinpeSales.add(saleId)
    }
  }
  report.cashCount = cashSales.size
  report.cardCount = cardSales.size
  report.sinpeCount = sinpeSales.size
  return report
}

function normalizeDbTs(value: string | null | undefined): string {
  if (!value) return ''
  return value.includes('T') ? value.replace('T', ' ') : value
}

function salesInDbRange(rows: SaleRow[], from: string, to: string): SaleRow[] {
  return rows.filter((row) => {
    const ts = normalizeDbTs(row.created_at)
    return ts !== '' && ts >= from && ts <= to
  })
}

function buildSalesTrend(
  rows: SaleRow[],
  fromDate: string,
  toDate: string,
): SalesTrendPoint[] {
  const byDay = new Map<string, { revenue: number; transactions: number }>()
  for (const day of daysInRange(fromDate, toDate)) {
    byDay.set(day, { revenue: 0, transactions: 0 })
  }
  for (const row of rows) {
    if (!row.created_at) continue
    const day = dbTimestampDay(row.created_at)
    const bucket = byDay.get(day)
    if (!bucket) continue
    bucket.revenue = round2(bucket.revenue + (row.total ?? 0))
    bucket.transactions++
  }
  return [...byDay.entries()].map(([date, v]) => ({ date, ...v }))
}

function buildSalesByHour(rows: SaleRow[]): SalesByHourPoint[] {
  const byHour = new Map<number, { transactions: number; revenue: number }>()
  for (let h = 0; h < 24; h++) {
    byHour.set(h, { transactions: 0, revenue: 0 })
  }
  for (const row of rows) {
    if (!row.created_at) continue
    const hour = dbTimestampHour(row.created_at)
    const bucket = byHour.get(hour)
    if (!bucket) continue
    bucket.transactions++
    bucket.revenue = round2(bucket.revenue + (row.total ?? 0))
  }
  return [...byHour.entries()]
    .toSorted(([a], [b]) => a - b)
    .map(([hour, v]) => ({ hour, ...v }))
}

async function monthProductAnalytics(
  storeId: StoreId,
  sales: SaleRow[],
  products: ProductLookupRow[],
): Promise<{
  topProducts: ProductPerformanceRow[]
  slowProducts: ProductPerformanceRow[]
  worstSellers: ProductPerformanceRow[]
  categoryPerformance: CategoryPerformanceRow[]
  taxSummary: TaxBreakdownReport
}> {
  const saleIds = sales.map((s) => s.id)
  if (saleIds.length === 0) {
    return {
      topProducts: [],
      slowProducts: [],
      worstSellers: [],
      categoryPerformance: [],
      taxSummary: buildTaxBreakdownFromLineItems([]),
    }
  }

  const items = await fetchInChunks(saleIds, DASHBOARD_CHUNK_SIZE, async (chunk) => {
    const { data, error } = await getSupabase()
      .from('sale_items')
      .select('product_id, product_name_snapshot, quantity, line_total, tax_category')
      .eq('store_id', storeId)
      .in('sale_id', chunk)
    if (error) throw error
    return data
  })

  const productMap = new Map(products.map((p) => [p.id, p]))
  const agg = new Map<number, ProductPerformanceRow>()

  for (const item of items) {
    const pid = item.product_id
    if (pid == null || pid <= 0) continue
    const p = productMap.get(pid)
    const qty = item.quantity ?? 0
    const lineTotal = item.line_total ?? 0
    const cost = p?.cost_price != null ? Number(p.cost_price) : 0
    const existing = agg.get(pid) ?? {
      productId: pid,
      name: (item.product_name_snapshot as string) || `Producto #${pid}`,
      sku: p?.barcode ? String(p.barcode) : '—',
      unitsSold: 0,
      revenue: 0,
      profit: 0,
      stock: p ? Number(p.stock) : 0,
      category: p ? p.category : null,
    }
    existing.unitsSold += qty
    existing.revenue = round2(existing.revenue + lineTotal)
    existing.profit = round2(existing.profit + lineTotal - cost * qty)
    agg.set(pid, existing)
  }

  const all = [...agg.values()]
  const taxSummary = buildTaxBreakdownFromLineItems(items)

  return {
    topProducts: all.toSorted((a, b) => b.revenue - a.revenue).slice(0, 10),
    slowProducts: all
      .filter((p) => p.stock > 0)
      .toSorted((a, b) => a.unitsSold - b.unitsSold)
      .slice(0, 10),
    worstSellers: all.toSorted((a, b) => a.revenue - b.revenue).slice(0, 10),
    categoryPerformance: categoryPerformance(all),
    taxSummary,
  }
}

function recentlyAddedProducts(
  products: ProductLookupRow[],
): ProductPerformanceRow[] {
  return products
    .filter((p) => !p.deleted_at)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 8)
    .map((p) => ({
      productId: p.id,
      name: p.name?.trim() || `Producto #${p.id}`,
      sku: p.barcode ? String(p.barcode) : '—',
      unitsSold: 0,
      revenue: 0,
      profit: 0,
      stock: Number(p.stock ?? 0),
      category: p.category,
    }))
}

function categoryPerformance(
  products: ProductPerformanceRow[],
): CategoryPerformanceRow[] {
  const byCat = new Map<string, { revenue: number; units: number }>()
  for (const p of products) {
    const cat = p.category?.trim() || '—'
    const existing = byCat.get(cat) ?? { revenue: 0, units: 0 }
    existing.revenue = round2(existing.revenue + p.revenue)
    existing.units += p.unitsSold
    byCat.set(cat, existing)
  }
  return [...byCat.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
}

export async function fetchDashboardProducts(storeId: StoreId): Promise<ProductLookupRow[]> {
  return fetchAllPages(async (offset, limit) => {
    const { data, error } = await getSupabase()
      .from('products')
      .select(
        'id, name, barcode, stock, stock_threshold, price, cost_price, category, deleted_at, updated_at, created_at',
      )
      .eq('store_id', storeId)
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data
  })
}

async function loadProducts(storeId: StoreId): Promise<ProductLookupRow[]> {
  return fetchDashboardProducts(storeId)
}

async function loadStoreSettings(storeId: StoreId): Promise<{ stockThresholdDefault: number }> {
  const { data, error } = await getSupabase()
    .from('stores')
    .select('stock_threshold_default')
    .eq('store_id', storeId)
    .maybeSingle()
  if (error) throw error
  const def = Number(data?.stock_threshold_default)
  return {
    stockThresholdDefault: Number.isFinite(def) && def >= 0 ? def : 5,
  }
}

async function recentAudit(storeId: StoreId, limit = 20): Promise<AuditRow[]> {
  const { data, error } = await getSupabase()
    .from('audit_log')
    .select(
      'id, store_id, user_id, username, action, entity, entity_id, detail, created_at',
    )
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

async function auditSince(
  storeId: StoreId,
  since: string,
): Promise<AuditRow[]> {
  return fetchAllPages(async (offset, limit) => {
    const { data, error } = await getSupabase()
      .from('audit_log')
      .select(
        'id, store_id, user_id, username, action, entity, entity_id, detail, created_at',
      )
      .eq('store_id', storeId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data
  })
}

async function stockMovementTrend(
  storeId: StoreId,
  fromDate: string,
  toDate: string,
  fromTs: string,
  toTs: string,
): Promise<DashboardStockMovementPoint[]> {
  const rows = await fetchAllPages(async (offset, limit) => {
    const { data, error } = await getSupabase()
      .from('stock_adjustments')
      .select('delta, created_at')
      .eq('store_id', storeId)
      .gte('created_at', fromTs)
      .lte('created_at', toTs)
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data
  })

  const byDay = new Map<string, { adjustmentCount: number; netDelta: number }>()
  for (const row of rows) {
    const createdAt = row.created_at as string
    const day = createdAt.slice(0, 10)
    const bucket = byDay.get(day) ?? { adjustmentCount: 0, netDelta: 0 }
    bucket.adjustmentCount++
    const rawDelta = Number(row.delta) || 0
    const delta =
      rawDelta > 10_000_000 || rawDelta < -10_000_000 ? 0 : rawDelta
    bucket.netDelta += delta
    byDay.set(day, bucket)
  }

  return daysInRange(fromDate, toDate).map((date) => {
    const row = byDay.get(date)
    return {
      date,
      adjustmentCount: row?.adjustmentCount ?? 0,
      netDelta: row?.netDelta ?? 0,
    }
  })
}

/** Net stock change per product since `since` (adjustments − sales + restocks). */
async function netProductStockChangeSince(
  storeId: StoreId,
  since: string,
): Promise<Map<number, number>> {
  const net = new Map<number, number>()
  const add = (productId: number | null | undefined, delta: number): void => {
    if (productId == null || productId <= 0 || !Number.isFinite(delta) || delta === 0) return
    net.set(productId, (net.get(productId) ?? 0) + delta)
  }

  const adjustments = await fetchAllPages(async (offset, limit) => {
    const { data, error } = await getSupabase()
      .from('stock_adjustments')
      .select('product_id, delta')
      .eq('store_id', storeId)
      .gte('created_at', since)
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data
  })
  for (const row of adjustments) {
    const rawDelta = Number(row.delta) || 0
    const delta =
      rawDelta > 10_000_000 || rawDelta < -10_000_000 ? 0 : rawDelta
    add(row.product_id as number | null, delta)
  }

  const sales = await fetchAllPages(async (offset, limit) => {
    const { data, error } = await getSupabase()
      .from('sales')
      .select('id')
      .eq('store_id', storeId)
      .gte('created_at', since)
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data
  })
  const saleIds = sales.map((s) => s.id as number)
  if (saleIds.length > 0) {
    const items = await fetchInChunks(saleIds, DASHBOARD_CHUNK_SIZE, async (chunk) => {
      const { data, error } = await getSupabase()
        .from('sale_items')
        .select('product_id, quantity')
        .eq('store_id', storeId)
        .in('sale_id', chunk)
      if (error) throw error
      return data
    })
    for (const item of items) {
      add(item.product_id as number | null, -(item.quantity ?? 0))
    }
  }

  const returnRows = await fetchAllPages(async (offset, limit) => {
    const { data, error } = await getSupabase()
      .from('return_items')
      .select('product_id, restocked')
      .eq('store_id', storeId)
      .gte('created_at', since)
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data
  })
  for (const row of returnRows) {
    const restocked = row.restocked ?? 0
    if (restocked > 0) add(row.product_id as number | null, restocked)
  }

  return net
}

async function countCierreDiscrepancies(storeId: StoreId, since: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from('cierres')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .gte('closed_at', since)
    .not('cash_difference', 'is', null)
    .neq('cash_difference', 0)
  if (error) throw error
  return count ?? 0
}

async function fetchPosUsers(storeId: StoreId): Promise<PosUserRow[]> {
  const rows = await fetchAllPages(async (offset, limit) => {
    const { data, error } = await getSupabase()
      .from('pos_users')
      .select('id, username, role, is_active')
      .eq('store_id', storeId)
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data
  })
  return rows.filter((row) => !isHiddenOperatorUsername(row.username))
}

export async function fetchDashboardTeam(storeId: StoreId): Promise<DashboardTeamData> {
  const today = todayLocal()
  const monthFrom = monthStartLocal(0)
  const monthB = rangeBounds(monthFrom, today)
  const activeSince = rangeBounds(daysAgoLocal(30), today).from

  const [posUsers, employeeAuditRows, monthSales] = await Promise.all([
    fetchPosUsers(storeId),
    auditSince(storeId, activeSince),
    salesInRange(storeId, monthB.from, monthB.to),
  ])

  const roleByUserId = posUserRoleMap(posUsers)
  const usernameByUserId = posUserUsernameMap(posUsers)

  return {
    employees: buildEmployeeOverviewFromPosUsers(posUsers),
    teamMembers: teamMembersFromPosUsers(posUsers),
    employeePerformance: employeePerformanceFromSales(
      monthSales,
      usernameByUserId,
      roleByUserId,
    ),
    roleSummaries: roleSummariesFromPosUsers(posUsers),
    recentEmployeeActivity: recentEmployeeActivity(employeeAuditRows),
    activeUsernames: posUsers.filter((u) => Number(u.is_active) === 1).length,
  }
}

async function fetchDashboard(
  storeId: StoreId,
  products?: ProductLookupRow[],
): Promise<DashboardData> {
  const today = todayLocal()
  const yesterday = daysAgoLocal(1)
  const monthFrom = monthStartLocal(0)
  const lastMonthFrom = monthStartLocal(1)
  const trendFromDate = daysAgoLocal(29)

  const todayB = dayBounds(today)
  const yesterdayB = dayBounds(yesterday)
  const monthB = rangeBounds(monthFrom, today)
  const trendB = rangeBounds(trendFromDate, today)
  const lastMonthLastDay = lastDayOfPreviousMonthLocal()
  const lastMonthB = rangeBounds(lastMonthFrom, lastMonthLastDay)

  const overallFrom = lastMonthB.from < trendB.from ? lastMonthB.from : trendB.from
  const overallTo = todayB.to

  const activeSince = rangeBounds(daysAgoLocal(30), today).from

  const [
    allSales,
    productRows,
    storeSettings,
    auditRows,
    cierreDiscrepancies,
    stockMovement,
  ] = await Promise.all([
    salesInRange(storeId, overallFrom, overallTo),
    products ? Promise.resolve(products) : loadProducts(storeId),
    loadStoreSettings(storeId),
    recentAudit(storeId),
    countCierreDiscrepancies(storeId, activeSince),
    stockMovementTrend(
      storeId,
      trendFromDate,
      today,
      trendB.from,
      trendB.to,
    ),
  ])

  const todaySales = salesInDbRange(allSales, todayB.from, todayB.to)
  const yesterdaySales = salesInDbRange(allSales, yesterdayB.from, yesterdayB.to)
  const monthSales = salesInDbRange(allSales, monthB.from, monthB.to)
  const lastMonthSales = salesInDbRange(allSales, lastMonthB.from, lastMonthB.to)
  const trendSales = salesInDbRange(allSales, trendB.from, trendB.to)
  const inv = inventoryBundleFromProducts(
    productRows,
    storeSettings.stockThresholdDefault,
  )
  const weekAgoEnd = `${daysAgoLocal(7)} 23:59:59`
  const stockChangeSinceWeek = await netProductStockChangeSince(storeId, weekAgoEnd)
  const invPrior = inventoryKpiPriorCounts(
    productRows,
    storeSettings.stockThresholdDefault,
    stockChangeSinceWeek,
  )

  const [monthPaymentRows, monthAnalytics] = await Promise.all([
    paymentsForSaleIds(
      storeId,
      monthSales.map((s) => s.id),
    ),
    monthProductAnalytics(storeId, monthSales, productRows),
  ])

  const paymentMonth = summarizePayments(monthPaymentRows)
  const paymentToday = summarizePayments(
    monthPaymentRows,
    new Set(todaySales.map((s) => s.id)),
  )

  const todayS = summarizeSales(todaySales)
  const yesterdayS = summarizeSales(yesterdaySales)
  const monthS = summarizeSales(monthSales)
  const lastMonthS = summarizeSales(lastMonthSales)
  const salesTrend = buildSalesTrend(trendSales, trendFromDate, today)
  const salesByHour = buildSalesByHour(todaySales)

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      todaySales: kpiTrend(todayS.totalRevenue, yesterdayS.totalRevenue),
      monthlySales: kpiTrend(monthS.totalRevenue, lastMonthS.totalRevenue),
      todayTransactions: kpiTrend(todayS.txCount, yesterdayS.txCount),
      avgTicketToday: kpiTrend(todayS.avgTicket, yesterdayS.avgTicket),
      lowStockAlerts: kpiTrend(inv.inventory.lowStock, invPrior.lowStock),
      outOfStock: kpiTrend(inv.inventory.outOfStock, invPrior.outOfStock),
    },
    salesTrend,
    salesByHour,
    paymentToday,
    paymentMonth,
    topProducts: monthAnalytics.topProducts,
    slowProducts: monthAnalytics.slowProducts,
    worstSellers: monthAnalytics.worstSellers,
    recentlyAddedProducts: recentlyAddedProducts(productRows),
    categoryPerformance: monthAnalytics.categoryPerformance,
    taxSummary: monthAnalytics.taxSummary,
    taxableSales: monthAnalytics.taxSummary.totalGross,
    inventory: inv.inventory,
    inventoryHealth: inv.inventoryHealth,
    stockMovementTrend: stockMovement,
    lowStockProducts: inv.lowStockProducts,
    outOfStockProducts: inv.outOfStockProducts,
    recentlyUpdatedInventory: inv.recentlyUpdatedInventory,
    recentAudit: auditRows,
    recentActivity: buildRecentActivity(auditRows),
    alerts: buildDashboardAlerts(inv.inventory, cierreDiscrepancies),
    ...EMPTY_DASHBOARD_TEAM,
  }
}

export async function fetchDashboardCached(
  storeId: StoreId,
  queryClient: QueryClient,
): Promise<DashboardData> {
  const products = await queryClient.fetchQuery({
    queryKey: ['dashboard-products', storeId],
    queryFn: () => fetchDashboardProducts(storeId),
    staleTime: DASHBOARD_PRODUCTS_STALE_MS,
    gcTime: QUERY_GC_MS,
  })
  return fetchDashboard(storeId, products)
}

export function prefetchDashboard(queryClient: QueryClient, storeId: StoreId): void {
  void queryClient.prefetchQuery({
    queryKey: ['dashboard-products', storeId],
    queryFn: () => fetchDashboardProducts(storeId),
    staleTime: DASHBOARD_PRODUCTS_STALE_MS,
    gcTime: QUERY_GC_MS,
  })
  void queryClient.prefetchQuery({
    queryKey: ['dashboard', storeId],
    queryFn: () => fetchDashboardCached(storeId, queryClient),
    staleTime: DASHBOARD_STALE_MS,
    gcTime: QUERY_GC_MS,
  })
}
