import type { TaxBreakdownReport } from '#/lib/reports.types'

export interface DashboardKpiTrend {
  value: number
  previousValue: number
  changePct: number | null
}

export interface DashboardKpis {
  todaySales: DashboardKpiTrend
  monthlySales: DashboardKpiTrend
  todayTransactions: DashboardKpiTrend
  avgTicketToday: DashboardKpiTrend
  lowStockAlerts: DashboardKpiTrend
  outOfStock: DashboardKpiTrend
}

export interface PaymentMethodReport {
  cash: number
  card: number
  sinpe: number
  cashCount: number
  cardCount: number
  sinpeCount: number
  total: number
}

export interface SalesTrendPoint {
  date: string
  revenue: number
  transactions: number
}

export interface ProductPerformanceRow {
  productId: number
  name: string
  sku: string
  unitsSold: number
  revenue: number
  profit: number
  stock: number
  category: string | null
}

export interface InventorySummary {
  totalProducts: number
  activeProducts: number
  lowStock: number
  outOfStock: number
  negativeStock: number
  costValue: number
  retailValue: number
}

export type DashboardActivityKind =
  | 'sale'
  | 'product_create'
  | 'product_update'
  | 'stock_adjust'
  | 'employee'
  | 'other'

export interface DashboardActivityItem {
  id: string
  kind: DashboardActivityKind
  messageKey: string
  detail: string
  username: string | null
  createdAt: string
  linkTo?: string
}

export type DashboardAlertKind =
  | 'low_stock'
  | 'out_of_stock'
  | 'negative_stock'
  | 'cierre_discrepancy'

export interface DashboardAlert {
  kind: DashboardAlertKind
  messageKey: string
  count: number
  severity: 'info' | 'warning' | 'danger'
  linkTo?: string
}

export interface InventoryProductRow {
  productId: number
  name: string
  sku: string
  stock: number
  minimum: number
  status: 'healthy' | 'low' | 'critical' | 'negative'
  updatedAt?: string
  category?: string | null
}

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

export type DashboardRole = 'admin' | 'sales' | 'product_manager'

export interface DashboardTeamMember {
  id: number
  username: string
  role: DashboardRole | null
  isActive: boolean
}

export interface DashboardEmployeeOverview {
  totalEmployees: number
  activeEmployees: number
  roleCounts: { role: DashboardRole; count: number }[]
}

export interface DashboardEmployeePerformanceRow {
  userId: number
  username: string
  role: DashboardRole
  transactions: number
  salesVolume: number
  avgTicket: number
}

export interface DashboardRoleSummary {
  role: DashboardRole
  count: number
  descriptionKey: string
}

export interface SalesByHourPoint {
  hour: number
  transactions: number
  revenue: number
}

export interface CategoryPerformanceRow {
  category: string
  revenue: number
  units: number
}

export interface DashboardData {
  generatedAt: string
  kpis: DashboardKpis
  salesTrend: SalesTrendPoint[]
  salesByHour: SalesByHourPoint[]
  paymentToday: PaymentMethodReport
  paymentMonth: PaymentMethodReport
  topProducts: ProductPerformanceRow[]
  slowProducts: ProductPerformanceRow[]
  worstSellers: ProductPerformanceRow[]
  recentlyAddedProducts: ProductPerformanceRow[]
  categoryPerformance: CategoryPerformanceRow[]
  inventory: InventorySummary
  inventoryHealth: DashboardInventoryHealth
  stockMovementTrend: DashboardStockMovementPoint[]
  lowStockProducts: InventoryProductRow[]
  outOfStockProducts: InventoryProductRow[]
  recentlyUpdatedInventory: InventoryProductRow[]
  recentAudit: AuditRow[]
  recentActivity: DashboardActivityItem[]
  alerts: DashboardAlert[]
  taxSummary: TaxBreakdownReport
  taxableSales: number
  employees: DashboardEmployeeOverview
  teamMembers: DashboardTeamMember[]
  employeePerformance: DashboardEmployeePerformanceRow[]
  roleSummaries: DashboardRoleSummary[]
  recentEmployeeActivity: AuditRow[]
  activeUsernames: number
}

export type DashboardTeamData = Pick<
  DashboardData,
  | 'employees'
  | 'teamMembers'
  | 'employeePerformance'
  | 'roleSummaries'
  | 'recentEmployeeActivity'
  | 'activeUsernames'
>

export interface CashierPerformanceRow {
  username: string
  cierreCount: number
  totalSales: number
  avgTicket: number
}

export interface CashMovementRow {
  id: number
  store_id: string
  type: string | null
  amount: number | null
  reason: string | null
  user_id: number | null
  created_at: string | null
  cierre_id: number | null
  username: string
}

export interface CierreRow {
  id: number
  store_id: string
  opened_at: string | null
  closed_at: string | null
  closed_by_username: string | null
  shift_label: string | null
  total_cash: number | null
  total_card: number | null
  total_sinpe: number | null
  total_sales: number | null
  cash_difference: number | null
  notes: string | null
}

export interface AuditRow {
  id: number
  store_id: string
  user_id: number | null
  username: string | null
  action: string
  entity: string | null
  entity_id: string | null
  detail: string | null
  created_at: string
}

export interface AuditUser {
  id: number
  username: string
}

export interface StorePresence {
  storeId: string
  label: string
  lastSeenAt: string | null
  online: boolean
}

export type ReportPeriod = 'today' | 'week' | 'month'

export interface DateRange {
  from: string
  to: string
  fromTime?: string
  toTime?: string
}

export interface SalesSummaryReport {
  txCount: number
  totalRevenue: number
  avgTicket: number
  discountTotal: number
}
