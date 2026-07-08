import { round2 } from '#/lib/money'
import type { FacturaPdfData, FacturaPdfItem } from '#/lib/factura-pdf'
import { facturaPrintTimestamp, formatFacturaDateTime } from '#/lib/factura-pdf'
import type { StoreId } from '#/lib/stores'
import { getSupabase } from '#/lib/supabase'
import { fetchInChunks } from '#/lib/supabase-page'

const CHUNK_SIZE = 500

type SaleFacturaRow = {
  id: number
  consecutivo: string | null
  created_at: string | null
  subtotal: number | null
  discount_total: number | null
  total: number | null
  customer_name: string | null
  customer_id: string | null
}

type SaleItemFacturaRow = {
  id?: number
  sale_id: number | null
  product_id: number | null
  product_name_snapshot: string | null
  barcode_snapshot: string | null
  quantity: number | null
  unit_price: number | null
  line_discount: number | null
  line_total: number | null
}

async function loadSales(
  storeId: StoreId,
  saleIds: number[],
): Promise<Map<number, SaleFacturaRow>> {
  if (saleIds.length === 0) return new Map()
  const rows = await fetchInChunks(saleIds, CHUNK_SIZE, async (chunk) => {
    const { data, error } = await getSupabase()
      .from('sales')
      .select(
        'id, consecutivo, created_at, subtotal, discount_total, total, customer_name, customer_id',
      )
      .eq('store_id', storeId)
      .in('id', chunk)
    if (error) throw error
    return data
  })
  return new Map(rows.map((row) => [row.id, row]))
}

async function loadSaleItems(
  storeId: StoreId,
  saleIds: number[],
): Promise<SaleItemFacturaRow[]> {
  if (saleIds.length === 0) return []
  return fetchInChunks(saleIds, CHUNK_SIZE, async (chunk) => {
    const { data, error } = await getSupabase()
      .from('sale_items')
      .select(
        'id, sale_id, product_id, product_name_snapshot, barcode_snapshot, quantity, unit_price, line_discount, line_total',
      )
      .eq('store_id', storeId)
      .in('sale_id', chunk)
    if (error) throw error
    return data
  })
}

async function loadProductBarcodes(
  storeId: StoreId,
  productIds: number[],
): Promise<Map<number, string | null>> {
  if (productIds.length === 0) return new Map()
  const rows = await fetchInChunks(productIds, CHUNK_SIZE, async (chunk) => {
    const { data, error } = await getSupabase()
      .from('products')
      .select('id, barcode')
      .eq('store_id', storeId)
      .in('id', chunk)
    if (error) throw error
    return data
  })
  return new Map(rows.map((row) => [row.id, row.barcode]))
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

function mapItems(
  rows: SaleItemFacturaRow[],
  barcodes: Map<number, string | null>,
): FacturaPdfItem[] {
  return rows.map((row) => ({
    productId: row.product_id,
    barcode:
      row.barcode_snapshot?.trim() ||
      (row.product_id != null ? (barcodes.get(row.product_id) ?? null) : null),
    name: row.product_name_snapshot?.trim() || '—',
    quantity: row.quantity ?? 0,
    unitPrice: row.unit_price ?? 0,
    lineDiscount: row.line_discount ?? 0,
    lineTotal: row.line_total ?? 0,
  }))
}

function subtotalFromItems(items: FacturaPdfItem[]): number {
  return round2(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))
}

function buildFacturaFromSale(
  sale: SaleFacturaRow,
  items: FacturaPdfItem[],
  cashier: string,
  storeName: string,
): FacturaPdfData {
  const subtotal = sale.subtotal ?? subtotalFromItems(items)
  return {
    storeName,
    consecutivo: sale.consecutivo?.trim() || String(sale.id),
    createdAt: sale.created_at ? formatFacturaDateTime(sale.created_at) : '—',
    printedAt: facturaPrintTimestamp(),
    cashier: cashier || '—',
    customer: {
      name: sale.customer_name,
      id: sale.customer_id,
    },
    subtotal,
    discountTotal: sale.discount_total ?? 0,
    total: sale.total ?? 0,
    items,
  }
}

export async function fetchFacturaPdfData(
  storeId: StoreId,
  saleId: number,
  storeName: string,
): Promise<FacturaPdfData> {
  const batch = await fetchFacturaPdfDataBatch(storeId, [saleId], storeName)
  if (batch.length === 0) throw new Error('errors.facturaPdfNotFound')
  return batch[0]
}

export async function fetchFacturaPdfDataBatch(
  storeId: StoreId,
  saleIds: number[],
  storeName: string,
): Promise<FacturaPdfData[]> {
  const uniqueIds = [...new Set(saleIds.filter((id) => id > 0))]
  if (uniqueIds.length === 0) return []

  const [salesById, itemRows, cashiers] = await Promise.all([
    loadSales(storeId, uniqueIds),
    loadSaleItems(storeId, uniqueIds),
    cashierNamesForSales(storeId, uniqueIds),
  ])

  const productIds = [
    ...new Set(
      itemRows.map((row) => row.product_id).filter((id): id is number => id != null && id > 0),
    ),
  ]
  const barcodes = await loadProductBarcodes(storeId, productIds)

  const itemsBySale = new Map<number, SaleItemFacturaRow[]>()
  for (const row of itemRows) {
    const saleId = row.sale_id
    if (saleId == null || saleId <= 0) continue
    const list = itemsBySale.get(saleId) ?? []
    list.push(row)
    itemsBySale.set(saleId, list)
  }
  for (const list of itemsBySale.values()) {
    list.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  }

  return saleIds
    .map((saleId) => {
      const sale = salesById.get(saleId)
      if (!sale) return null
      const items = mapItems(itemsBySale.get(saleId) ?? [], barcodes)
      return buildFacturaFromSale(sale, items, cashiers.get(saleId) ?? '—', storeName)
    })
    .filter((doc): doc is FacturaPdfData => doc != null)
}
