export type ReportType =
  | 'summary'
  | 'byPayment'
  | 'topProducts'
  | 'inventory'
  | 'taxBreakdown'
  | 'transactionLog'
  | 'itemizedSales'

export type ReportPeriodPreset = 'today' | 'week' | 'month'

export type TaxCategory = 'standard'
export type TaxRegime = 'simplificado' | 'tradicional'
export type PaymentMethod = 'cash' | 'card' | 'sinpe'

export interface PeriodCashTotals {
  openingFloat: number
  cashIn: number
  cashOut: number
  cashSales: number
}

export interface SalesSummaryDayRow {
  date: string
  totalRevenue: number
  txCount: number
  avgTicket: number
}

export interface SalesSummaryReport {
  totalRevenue: number
  txCount: number
  itemsSold: number
  returnsCount: number
  avgTicket: number
  totalDiscount: number
  grossProfit: number
  cash: PeriodCashTotals
  /** Per-day rows when the report range spans multiple days (days with sales only). */
  days?: SalesSummaryDayRow[]
}

export interface PaymentMethodReport {
  cash: number
  card: number
  sinpe: number
  total: number
  countCash: number
  countCard: number
  countSinpe: number
}

export interface TopProductRow {
  productId: number
  name: string
  barcode: string
  quantity: number
  revenue: number
  profit: number
  marginPct: number | null
}

export interface InventoryRow {
  id: number
  barcode: string
  name: string
  category: string | null
  stock: number
  threshold: number
  price: number
  value: number
}

export interface InventoryReport {
  rows: InventoryRow[]
  total: number
  totalValue: number
  page: number
  pageSize: number
}

export interface TaxBreakdownRow {
  taxCategory: TaxCategory
  rate: number
  gross: number
  base: number
  iva: number
}

export interface TaxBreakdownReport {
  regime: TaxRegime
  rows: TaxBreakdownRow[]
  totalGross: number
  totalBase: number
  totalIva: number
}

export interface SalePaymentSnapshot {
  method: PaymentMethod
  amount: number
  ref: string | null
}

export interface TransactionLogRow {
  saleId: number
  consecutivo: string | null
  createdAt: string
  cashier: string
  total: number
  discountTotal: number
  customerName: string | null
  payments: SalePaymentSnapshot[]
}

export interface TransactionLogReport {
  rows: TransactionLogRow[]
  totalRevenue: number
  txCount: number
}

export interface ItemizedSalesLineRow {
  saleItemId: number
  productName: string
  barcode: string | null
  quantity: number
  unitPrice: number
  lineDiscount: number
  lineTotal: number
}

export interface ItemizedSalesSaleRow {
  saleId: number
  consecutivo: string | null
  createdAt: string
  cashier: string
  total: number
  discountTotal: number
  cartDiscount: number
  customerName: string | null
  payments: SalePaymentSnapshot[]
  items: ItemizedSalesLineRow[]
}

export interface ItemizedSalesReport {
  sales: ItemizedSalesSaleRow[]
  totalRevenue: number
  itemsSold: number
}

export type ReportData =
  | { type: 'summary'; data: SalesSummaryReport }
  | { type: 'byPayment'; data: PaymentMethodReport }
  | { type: 'topProducts'; data: TopProductRow[] }
  | { type: 'inventory'; data: InventoryReport }
  | { type: 'taxBreakdown'; data: TaxBreakdownReport }
  | { type: 'transactionLog'; data: TransactionLogReport }
  | { type: 'itemizedSales'; data: ItemizedSalesReport }
