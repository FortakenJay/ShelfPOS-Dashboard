import type {
  AuditRow,
  DashboardActivityItem,
  DashboardAlert,
  InventorySummary,
} from '#/lib/types'

/** POS audit detail: `consecutivo · total` or `consecutivo · total · desc …`. */
export function parseSaleActivityTotal(detail: string): number | null {
  const parts = detail.split(' · ')
  if (parts.length < 2) return null
  const total = Number(parts[1]?.trim())
  return Number.isFinite(total) ? total : null
}

function mapAuditToActivity(row: AuditRow): DashboardActivityItem {
  const action = row.action
  let kind: DashboardActivityItem['kind'] = 'other'
  const messageKey = `audit.actions.${action}`
  let linkTo: string | undefined

  if (action.startsWith('product_')) {
    kind = action.includes('create') ? 'product_create' : 'product_update'
  } else if (action.startsWith('stock_')) {
    kind = 'stock_adjust'
  } else if (action.startsWith('sale_') || action === 'return_created') {
    kind = 'sale'
    linkTo = '/reports'
  } else if (action.includes('user') || action.includes('login')) {
    kind = 'employee'
    linkTo = '/audit'
  }

  return {
    id: `audit-${row.id}`,
    kind,
    messageKey,
    detail: row.detail ?? row.entity ?? '',
    username: row.username,
    createdAt: row.created_at,
    linkTo,
  }
}

export function buildRecentActivity(auditRows: AuditRow[]): DashboardActivityItem[] {
  return auditRows.map(mapAuditToActivity).slice(0, 24)
}

export function buildDashboardAlerts(
  inventory: InventorySummary,
  cierreDiscrepancies: number,
): DashboardAlert[] {
  const alerts: DashboardAlert[] = []

  if (inventory.lowStock > 0) {
    alerts.push({
      kind: 'low_stock',
      messageKey: 'dashboard.alerts.lowStock',
      count: inventory.lowStock,
      severity: 'warning',
      linkTo: '/dashboard',
    })
  }
  if (inventory.outOfStock > 0) {
    alerts.push({
      kind: 'out_of_stock',
      messageKey: 'dashboard.alerts.outOfStock',
      count: inventory.outOfStock,
      severity: 'danger',
      linkTo: '/dashboard',
    })
  }
  if (inventory.negativeStock > 0) {
    alerts.push({
      kind: 'negative_stock',
      messageKey: 'dashboard.alerts.negativeStock',
      count: inventory.negativeStock,
      severity: 'danger',
      linkTo: '/dashboard',
    })
  }
  if (cierreDiscrepancies > 0) {
    alerts.push({
      kind: 'cierre_discrepancy',
      messageKey: 'dashboard.alerts.cierreDiscrepancy',
      count: cierreDiscrepancies,
      severity: 'warning',
      linkTo: '/cierres',
    })
  }
  return alerts
}
