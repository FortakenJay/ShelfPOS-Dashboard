import type {
  InventoryProductRow,
  InventorySummary,
} from '#/lib/types'

export type DashboardStockStatus = InventoryProductRow['status']

export interface DashboardInventoryHealth {
  healthy: number
  low: number
  critical: number
  negative: number
}

export interface DashboardStockMovementPoint {
  date: string
  adjustmentCount: number
  netDelta: number
}

type ProductRow = {
  id: number
  name: string | null
  barcode: string | null
  stock: number | null
  stock_threshold: number | null
  price: number | null
  cost_price: number | null
  category: string | null
  deleted_at: string | null
  updated_at?: string | null
}

const MAX_PRODUCT_STOCK = 10_000_000

function valuationStock(raw: number | null | undefined): number {
  const stock = raw ?? 0
  if (stock > MAX_PRODUCT_STOCK) return 0
  return Math.max(stock, 0)
}

function stockStatus(stock: number, minimum: number): DashboardStockStatus {
  if (stock < 0) return 'negative'
  if (stock <= 0) return 'critical'
  if (stock <= minimum) return 'low'
  return 'healthy'
}

function countInventoryAlerts(
  products: ProductRow[],
  stockThresholdDefault: number,
  stockByProductId?: Map<number, number>,
): { lowStock: number; outOfStock: number } {
  let lowStock = 0
  let outOfStock = 0
  for (const p of products) {
    if (p.deleted_at != null) continue
    const stock = stockByProductId?.get(p.id) ?? (p.stock ?? 0)
    const threshold = p.stock_threshold ?? stockThresholdDefault
    if (stock === 0) outOfStock++
    else if (stock > 0 && stock <= threshold) lowStock++
  }
  return { lowStock, outOfStock }
}

/** Reconstruct stock at cutoff: prior = current − net change since cutoff. */
export function inventoryKpiPriorCounts(
  products: ProductRow[],
  stockThresholdDefault: number,
  netStockChangeSinceCutoff: Map<number, number>,
): { lowStock: number; outOfStock: number } {
  const priorStock = new Map<number, number>()
  for (const p of products) {
    if (p.deleted_at != null) continue
    const current = p.stock ?? 0
    const delta = netStockChangeSinceCutoff.get(p.id) ?? 0
    priorStock.set(p.id, current - delta)
  }
  return countInventoryAlerts(products, stockThresholdDefault, priorStock)
}

export function inventoryBundleFromProducts(
  products: ProductRow[],
  stockThresholdDefault: number,
): {
  inventory: InventorySummary
  inventoryHealth: DashboardInventoryHealth
  lowStockProducts: InventoryProductRow[]
  outOfStockProducts: InventoryProductRow[]
  recentlyUpdatedInventory: InventoryProductRow[]
} {
  const rows = products.filter((p) => p.deleted_at == null)
  const def = stockThresholdDefault
  let lowStock = 0
  let outOfStock = 0
  let negativeStock = 0
  let activeProducts = 0
  let costValue = 0
  let retailValue = 0
  const health: DashboardInventoryHealth = {
    healthy: 0,
    low: 0,
    critical: 0,
    negative: 0,
  }
  const low: InventoryProductRow[] = []
  const out: InventoryProductRow[] = []
  const recentCandidates: InventoryProductRow[] = []

  for (const p of rows) {
    const rawStock = p.stock ?? 0
    const valuedStock = valuationStock(p.stock)
    const threshold = p.stock_threshold ?? def
    costValue += valuedStock * (p.cost_price ?? 0)
    retailValue += valuedStock * (p.price ?? 0)

    if (rawStock > 0) activeProducts++
    if (rawStock < 0) {
      negativeStock++
      health.negative++
    } else if (rawStock === 0) {
      outOfStock++
      health.critical++
    } else if (rawStock <= threshold) {
      lowStock++
      health.low++
    } else {
      health.healthy++
    }

    const base: InventoryProductRow = {
      productId: p.id,
      name: p.name as string,
      sku: String(p.barcode ?? '—'),
      stock: rawStock,
      minimum: threshold,
      status: stockStatus(rawStock, threshold),
      updatedAt: p.updated_at ?? '',
      category: p.category,
    }

    if (rawStock === 0) {
      out.push(base)
    } else if (rawStock <= threshold) {
      low.push(base)
    }

    if (p.updated_at) {
      recentCandidates.push(base)
    }
  }

  low.sort((a, b) => a.stock - b.stock)
  out.sort((a, b) => a.name.localeCompare(b.name))
  recentCandidates.sort((a, b) =>
    (b.updatedAt ?? '') < (a.updatedAt ?? '') ? -1 : 1,
  )

  return {
    inventory: {
      totalProducts: rows.length,
      activeProducts,
      lowStock,
      outOfStock,
      negativeStock,
      costValue: Math.round(costValue * 100) / 100,
      retailValue: Math.round(retailValue * 100) / 100,
    },
    inventoryHealth: health,
    lowStockProducts: low.slice(0, 12),
    outOfStockProducts: out.slice(0, 12),
    recentlyUpdatedInventory: recentCandidates.slice(0, 12),
  }
}
