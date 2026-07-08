import {
  daysInRange,
  dbTimestampDay,
  rangeBounds,
  rangeBoundsFromDateRange,
} from '#/lib/dates'
import { round2 } from '#/lib/money'
import type { StoreId } from '#/lib/stores'
import type { DateRange } from '#/lib/types'
import type {
  InventoryReport,
  InventoryRow,
  ItemizedSalesReport,
  PaymentMethodReport,
  ReportData,
  ReportType,
  SalesSummaryDayRow,
  SalesSummaryReport,
  SalePaymentSnapshot,
  TaxBreakdownReport,
  TopProductRow,
  TransactionLogReport,
} from '#/lib/reports.types'
import { buildTaxBreakdownFromLineItems } from '#/lib/tax-breakdown'
import { getSupabase } from '#/lib/supabase'
import { fetchAllPages, fetchInChunks } from '#/lib/supabase-page'

const CHUNK_SIZE = 500
const TOP_PRODUCTS_LIMIT = 10
const INVENTORY_PAGE_SIZE_MAX = 200
const INVENTORY_EXPORT_PAGE_CONCURRENCY = 4
const MAX_PRODUCT_STOCK = 10_000_000

type SaleRow = {
  id: number
  user_id: number | null
  total: number | null
  discount_total: number | null
  cart_discount: number | null
  consecutivo: string | null
  customer_name: string | null
  created_at: string | null
}

type SaleItemRow = {
  id?: number
  sale_id: number | null
  product_id: number | null
  product_name_snapshot: string | null
  quantity: number | null
  unit_price: number | null
  line_discount: number | null
  line_total: number | null
  tax_category: string | null
}

type SalePaymentRow = {
  sale_id: number | null
  method: string | null
  amount: number | null
  ref: string | null
}

type ProductCostRow = {
  id: number
  cost_price: number | null
  barcode: string | null
}

function boundsForReport(type: ReportType, range: DateRange): { from: string; to: string } {
  if (type === 'transactionLog' || type === 'itemizedSales') {
    return rangeBoundsFromDateRange(range)
  }
  return rangeBounds(range.from, range.to)
}

function valuationStock(raw: number | null | undefined): number {
  const stock = raw ?? 0
  if (stock > MAX_PRODUCT_STOCK) return 0
  return Math.max(stock, 0)
}

async function loadStockThresholdDefault(storeId: StoreId): Promise<number> {
  const { data, error } = await getSupabase()
    .from('stores')
    .select('stock_threshold_default')
    .eq('store_id', storeId)
    .maybeSingle()
  if (error) throw error
  const n = Number(data?.stock_threshold_default)
  return Number.isFinite(n) && n >= 0 ? n : 5
}

async function salesInRange(
  storeId: StoreId,
  from: string,
  to: string,
): Promise<SaleRow[]> {
  return fetchAllPages(async (offset, limit) => {
    const { data, error } = await getSupabase()
      .from('sales')
      .select(
        'id, user_id, total, discount_total, cart_discount, consecutivo, customer_name, created_at',
      )
      .eq('store_id', storeId)
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data
  })
}

async function saleItemsForSaleIds(
  storeId: StoreId,
  saleIds: number[],
): Promise<SaleItemRow[]> {
  if (saleIds.length === 0) return []
  return fetchInChunks(saleIds, CHUNK_SIZE, async (chunk) => {
    const { data, error } = await getSupabase()
      .from('sale_items')
      .select(
        'id, sale_id, product_id, product_name_snapshot, quantity, unit_price, line_discount, line_total, tax_category',
      )
      .eq('store_id', storeId)
      .in('sale_id', chunk)
    if (error) throw error
    return data
  })
}

async function paymentsForSaleIds(
  storeId: StoreId,
  saleIds: number[],
): Promise<SalePaymentRow[]> {
  if (saleIds.length === 0) return []
  return fetchInChunks(saleIds, CHUNK_SIZE, async (chunk) => {
    const { data, error } = await getSupabase()
      .from('sale_payments')
      .select('sale_id, method, amount, ref')
      .eq('store_id', storeId)
      .in('sale_id', chunk)
    if (error) throw error
    return data
  })
}

async function productCostsForIds(
  storeId: StoreId,
  productIds: number[],
): Promise<Map<number, ProductCostRow>> {
  if (productIds.length === 0) return new Map()
  const rows = await fetchInChunks(productIds, CHUNK_SIZE, async (chunk) => {
    const { data, error } = await getSupabase()
      .from('products')
      .select('id, cost_price, barcode')
      .eq('store_id', storeId)
      .in('id', chunk)
    if (error) throw error
    return data
  })
  return new Map(rows.map((r) => [r.id, r]))
}

async function cashierNamesForSales(
  storeId: StoreId,
  saleIds: number[],
): Promise<Map<number, string>> {
  if (saleIds.length === 0) return new Map()
  const rows = await fetchInChunks(saleIds, CHUNK_SIZE, async (chunk) => {
    const { data, error } = await getSupabase()
      .from('audit_log')
      .select('entity_id, username')
      .eq('store_id', storeId)
      .eq('entity', 'sale')
      .eq('action', 'sale_created')
      .in('entity_id', chunk.map(String))
    if (error) throw error
    return data
  })
  const map = new Map<number, string>()
  for (const row of rows) {
    const saleId = Number(row.entity_id)
    const name = (row.username as string | null)?.trim()
    if (saleId > 0 && name) map.set(saleId, name)
  }
  return map
}

function summarizePayments(pays: SalePaymentRow[]): PaymentMethodReport {
  const report: PaymentMethodReport = {
    cash: 0,
    card: 0,
    sinpe: 0,
    total: 0,
    countCash: 0,
    countCard: 0,
    countSinpe: 0,
  }
  const cashSales = new Set<number>()
  const cardSales = new Set<number>()
  const sinpeSales = new Set<number>()
  for (const p of pays) {
    const saleId = Number(p.sale_id)
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
  report.countCash = cashSales.size
  report.countCard = cardSales.size
  report.countSinpe = sinpeSales.size
  return report
}

function paymentsBySale(paymentRows: SalePaymentRow[]): Map<number, SalePaymentSnapshot[]> {
  const map = new Map<number, SalePaymentSnapshot[]>()
  for (const row of paymentRows) {
    const saleId = Number(row.sale_id)
    if (row.method !== 'cash' && row.method !== 'card' && row.method !== 'sinpe') continue
    const method = row.method
    const list = map.get(saleId) ?? []
    list.push({
      method,
      amount: round2(row.amount ?? 0),
      ref: row.ref,
    })
    map.set(saleId, list)
  }
  return map
}

async function cashMovementTotals(
  storeId: StoreId,
  from: string,
  to: string,
): Promise<{ openingFloat: number; cashIn: number; cashOut: number }> {
  const rows = await fetchAllPages(async (offset, limit) => {
    const { data, error } = await getSupabase()
      .from('cash_movements')
      .select('type, amount')
      .eq('store_id', storeId)
      .gte('created_at', from)
      .lte('created_at', to)
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data
  })
  let openingFloat = 0
  let cashIn = 0
  let cashOut = 0
  for (const row of rows) {
    const amount = row.amount ?? 0
    if (row.type === 'opening_float') openingFloat = round2(openingFloat + amount)
    else if (row.type === 'cash_in') cashIn = round2(cashIn + amount)
    else if (row.type === 'cash_out') cashOut = round2(cashOut + amount)
  }
  return { openingFloat, cashIn, cashOut }
}

async function returnsCount(storeId: StoreId, from: string, to: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from('return_items')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .gte('created_at', from)
    .lte('created_at', to)
  if (error) throw error
  return count ?? 0
}

async function grossProfitForSales(
  storeId: StoreId,
  saleIds: number[],
): Promise<number> {
  const items = await saleItemsForSaleIds(storeId, saleIds)
  const productIds = [
    ...new Set(
      items
        .map((i) => i.product_id)
        .filter((id): id is number => id != null && id > 0),
    ),
  ]
  const costs = await productCostsForIds(storeId, productIds)
  let profit = 0
  for (const item of items) {
    const lineTotal = item.line_total ?? 0
    const pid = item.product_id
    if (!pid) continue
    const cost = costs.get(pid)?.cost_price ?? 0
    profit = round2(profit + lineTotal - cost * (item.quantity ?? 0))
  }
  return profit
}

function buildSummaryDays(range: DateRange, sales: SaleRow[]): SalesSummaryDayRow[] | undefined {
  if (range.from === range.to) return undefined

  const byDay = new Map<string, SaleRow[]>()
  for (const day of daysInRange(range.from, range.to)) {
    byDay.set(day, [])
  }
  for (const sale of sales) {
    if (!sale.created_at) continue
    const day = dbTimestampDay(sale.created_at)
    byDay.get(day)?.push(sale)
  }

  const rows: SalesSummaryDayRow[] = []
  for (const date of daysInRange(range.from, range.to)) {
    const daySales = byDay.get(date) ?? []
    const txCount = daySales.length
    if (txCount === 0) continue
    const totalRevenue = round2(daySales.reduce((sum, s) => sum + (s.total ?? 0), 0))
    rows.push({
      date,
      totalRevenue,
      txCount,
      avgTicket: round2(totalRevenue / txCount),
    })
  }
  return rows.length > 0 ? rows : undefined
}

async function runSummary(
  storeId: StoreId,
  bounds: { from: string; to: string },
  range: DateRange,
): Promise<SalesSummaryReport> {
  const sales = await salesInRange(storeId, bounds.from, bounds.to)
  const saleIds = sales.map((s) => s.id)
  const totalRevenue = round2(sales.reduce((sum, s) => sum + (s.total ?? 0), 0))
  const txCount = sales.length
  const totalDiscount = round2(sales.reduce((sum, s) => sum + (s.discount_total ?? 0), 0))
  const [items, returnsCountVal, payments, cashMovements, grossProfit] = await Promise.all([
    saleItemsForSaleIds(storeId, saleIds),
    returnsCount(storeId, bounds.from, bounds.to),
    paymentsForSaleIds(storeId, saleIds),
    cashMovementTotals(storeId, bounds.from, bounds.to),
    grossProfitForSales(storeId, saleIds),
  ])
  const itemsSold = items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)

  const days = buildSummaryDays(range, sales)

  return {
    totalRevenue,
    txCount,
    itemsSold,
    returnsCount: returnsCountVal,
    avgTicket: txCount > 0 ? round2(totalRevenue / txCount) : 0,
    totalDiscount,
    grossProfit,
    cash: {
      openingFloat: cashMovements.openingFloat,
      cashIn: cashMovements.cashIn,
      cashOut: cashMovements.cashOut,
      cashSales: summarizePayments(payments).cash,
    },
    ...(days && days.length > 0 ? { days } : {}),
  }
}

async function runByPayment(
  storeId: StoreId,
  bounds: { from: string; to: string },
): Promise<PaymentMethodReport> {
  const sales = await salesInRange(storeId, bounds.from, bounds.to)
  const pays = await paymentsForSaleIds(storeId, sales.map((s) => s.id))
  return summarizePayments(pays)
}

async function runTopProducts(
  storeId: StoreId,
  bounds: { from: string; to: string },
): Promise<TopProductRow[]> {
  const sales = await salesInRange(storeId, bounds.from, bounds.to)
  const saleIds = sales.map((s) => s.id)
  const items = await saleItemsForSaleIds(storeId, saleIds)
  const productIds = [
    ...new Set(
      items
        .map((i) => i.product_id)
        .filter((id): id is number => id != null && id > 0),
    ),
  ]
  const costs = await productCostsForIds(storeId, productIds)

  const agg = new Map<number, TopProductRow>()
  for (const item of items) {
    const pid = item.product_id
    if (pid == null || pid <= 0) continue
    const name = item.product_name_snapshot ?? `Producto #${pid}`
    const existing = agg.get(pid) ?? {
      productId: pid,
      name,
      barcode: costs.get(pid)?.barcode ?? '',
      quantity: 0,
      revenue: 0,
      profit: 0,
      marginPct: null,
    }
    const qty = item.quantity ?? 0
    const revenue = item.line_total ?? 0
    const cost = pid > 0 ? (costs.get(pid)?.cost_price ?? 0) : 0
    existing.quantity += qty
    existing.revenue = round2(existing.revenue + revenue)
    existing.profit = round2(existing.profit + revenue - cost * qty)
    agg.set(pid, existing)
  }

  return [...agg.values()]
    .map((row) => ({
      ...row,
      marginPct:
        row.revenue > 0 ? round2((row.profit / row.revenue) * 100) : null,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, TOP_PRODUCTS_LIMIT)
}

async function inventoryTotalValue(storeId: StoreId): Promise<number> {
  const rows = await fetchAllPages(async (offset, limit) => {
    const { data, error } = await getSupabase()
      .from('products')
      .select('stock, price')
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data
  })
  return round2(
    rows.reduce(
      (sum, p) => round2(sum + valuationStock(p.stock) * (p.price ?? 0)),
      0,
    ),
  )
}

async function runInventory(
  storeId: StoreId,
  page: number,
  pageSize: number,
): Promise<InventoryReport> {
  const [def, countResult] = await Promise.all([
    loadStockThresholdDefault(storeId),
    getSupabase()
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .is('deleted_at', null),
  ])
  const { count, error: countError } = countResult
  if (countError) throw countError
  const total = count ?? 0

  const safePageSize = Math.min(
    Math.max(Math.trunc(pageSize), 1),
    INVENTORY_PAGE_SIZE_MAX,
  )
  const totalPages = total === 0 ? 1 : Math.ceil(total / safePageSize)
  const safePage = Math.min(Math.max(Math.trunc(page), 1), totalPages)
  const offset = (safePage - 1) * safePageSize

  const [queryResult, totalValue] = await Promise.all([
    getSupabase()
      .from('products')
      .select('id, barcode, name, category, stock, stock_threshold, price')
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .range(offset, offset + safePageSize - 1),
    inventoryTotalValue(storeId),
  ])
  const { data, error } = queryResult
  if (error) throw error

  const rows: InventoryRow[] = data.map((p) => {
    const rawStock = p.stock ?? 0
    const price = p.price ?? 0
    const value = round2(valuationStock(p.stock) * price)
    return {
      id: p.id,
      barcode: String(p.barcode ?? ''),
      name: p.name ?? '',
      category: p.category,
      stock: rawStock,
      threshold: p.stock_threshold ?? def,
      price,
      value,
    }
  })

  return {
    rows,
    total,
    totalValue,
    page: safePage,
    pageSize: safePageSize,
  }
}

async function runTaxBreakdown(
  storeId: StoreId,
  bounds: { from: string; to: string },
): Promise<TaxBreakdownReport> {
  const sales = await salesInRange(storeId, bounds.from, bounds.to)
  const items = await saleItemsForSaleIds(storeId, sales.map((s) => s.id))
  return buildTaxBreakdownFromLineItems(items)
}

function cashierLabel(sale: SaleRow, cashiers: Map<number, string>): string {
  const name = cashiers.get(sale.id)
  if (name) return name
  if (sale.user_id != null) return `#${sale.user_id}`
  return '—'
}

async function runTransactionLog(
  storeId: StoreId,
  bounds: { from: string; to: string },
): Promise<TransactionLogReport> {
  const sales = await salesInRange(storeId, bounds.from, bounds.to)
  const saleIds = sales.map((s) => s.id)
  const payments = await paymentsForSaleIds(storeId, saleIds)
  const paymentMap = paymentsBySale(payments)
  const cashiers = await cashierNamesForSales(storeId, saleIds)

  const rows = sales.map((sale) => ({
    saleId: sale.id,
    consecutivo: sale.consecutivo,
    createdAt: sale.created_at ?? '',
    cashier: cashierLabel(sale, cashiers),
    total: round2(sale.total ?? 0),
    discountTotal: round2(sale.discount_total ?? 0),
    customerName: sale.customer_name,
    payments: paymentMap.get(sale.id) ?? [],
  }))

  return {
    rows,
    totalRevenue: round2(rows.reduce((s, r) => s + r.total, 0)),
    txCount: rows.length,
  }
}

async function runItemizedSales(
  storeId: StoreId,
  bounds: { from: string; to: string },
): Promise<ItemizedSalesReport> {
  const sales = await salesInRange(storeId, bounds.from, bounds.to)
  const saleIds = sales.map((s) => s.id)
  const [payments, cashiers, items] = await Promise.all([
    paymentsForSaleIds(storeId, saleIds),
    cashierNamesForSales(storeId, saleIds),
    saleItemsForSaleIds(storeId, saleIds),
  ])
  const paymentMap = paymentsBySale(payments)
  const productIds = [
    ...new Set(
      items
        .map((i) => i.product_id)
        .filter((id): id is number => id != null && id > 0),
    ),
  ]
  const costs = await productCostsForIds(storeId, productIds)

  const itemsBySale = new Map<number, ItemizedSalesReport['sales'][number]['items']>()
  let itemsSold = 0
  for (const row of items) {
    const saleId = Number(row.sale_id)
    const list = itemsBySale.get(saleId) ?? []
    list.push({
      saleItemId: row.id ?? 0,
      productName: row.product_name_snapshot ?? '—',
      barcode: costs.get(row.product_id ?? 0)?.barcode ?? null,
      quantity: row.quantity ?? 0,
      unitPrice: round2(row.unit_price ?? 0),
      lineDiscount: round2(row.line_discount ?? 0),
      lineTotal: round2(row.line_total ?? 0),
    })
    itemsBySale.set(saleId, list)
    itemsSold += row.quantity ?? 0
  }

  const salesOut = sales.map((sale) => ({
    saleId: sale.id,
    consecutivo: sale.consecutivo,
    createdAt: sale.created_at ?? '',
    cashier: cashierLabel(sale, cashiers),
    total: round2(sale.total ?? 0),
    discountTotal: round2(sale.discount_total ?? 0),
    cartDiscount: round2(sale.cart_discount ?? 0),
    customerName: sale.customer_name,
    payments: paymentMap.get(sale.id) ?? [],
    items: itemsBySale.get(sale.id) ?? [],
  }))

  return {
    sales: salesOut,
    totalRevenue: round2(salesOut.reduce((s, r) => s + r.total, 0)),
    itemsSold,
  }
}

export async function runReport(
  storeId: StoreId,
  type: ReportType,
  range: DateRange,
  options?: { page?: number; pageSize?: number },
): Promise<ReportData> {
  const bounds = boundsForReport(type, range)
  switch (type) {
    case 'summary':
      return { type, data: await runSummary(storeId, bounds, range) }
    case 'byPayment':
      return { type, data: await runByPayment(storeId, bounds) }
    case 'topProducts':
      return { type, data: await runTopProducts(storeId, bounds) }
    case 'inventory':
      return {
        type,
        data: await runInventory(
          storeId,
          options?.page ?? 1,
          options?.pageSize ?? 50,
        ),
      }
    case 'taxBreakdown':
      return { type, data: await runTaxBreakdown(storeId, bounds) }
    case 'transactionLog':
      return { type, data: await runTransactionLog(storeId, bounds) }
    case 'itemizedSales':
      return { type, data: await runItemizedSales(storeId, bounds) }
    default:
      return { type: 'summary', data: await runSummary(storeId, bounds, range) }
  }
}

export async function fetchReportForExport(
  storeId: StoreId,
  type: ReportType,
  range: DateRange,
): Promise<ReportData> {
  if (type !== 'inventory') {
    return runReport(storeId, type, range)
  }

  const first = await runReport(storeId, type, range, {
    page: 1,
    pageSize: INVENTORY_PAGE_SIZE_MAX,
  })
  const data = first.data
  if (data.rows.length >= data.total) {
    return first
  }

  const allRows = [...data.rows]
  const totalPages = Math.ceil(data.total / INVENTORY_PAGE_SIZE_MAX)
  const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => i + 2)
  const batches: number[][] = []
  for (let i = 0; i < remainingPages.length; i += INVENTORY_EXPORT_PAGE_CONCURRENCY) {
    batches.push(remainingPages.slice(i, i + INVENTORY_EXPORT_PAGE_CONCURRENCY))
  }

  const batchResults = await Promise.all(
    batches.map((batch) =>
      Promise.all(
        batch.map((page) =>
          runReport(storeId, type, range, {
            page,
            pageSize: INVENTORY_PAGE_SIZE_MAX,
          }),
        ),
      ),
    ),
  )

  for (const pageResults of batchResults) {
    for (const next of pageResults) {
      if (next.data.rows.length === 0) continue
      allRows.push(...next.data.rows)
    }
    if (allRows.length >= data.total) break
  }

  return {
    type: 'inventory',
    data: {
      ...data,
      rows: allRows,
      page: 1,
      pageSize: allRows.length,
    },
  }
}
