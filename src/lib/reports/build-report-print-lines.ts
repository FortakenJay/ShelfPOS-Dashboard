import { formatReportNow, formatReportTimestamp } from '#/lib/dates'
import { formatMoney } from '#/lib/money'
import type { PrintLine } from '#/lib/reports/print-line.types'
import type {
  InventoryReport,
  ItemizedSalesReport,
  PaymentMethod,
  PaymentMethodReport,
  ReportData,
  ReportType,
  SalePaymentSnapshot,
  SalesSummaryReport,
  TaxBreakdownReport,
  TopProductRow,
  TransactionLogReport,
} from '#/lib/reports.types'
import type { DateRange } from '#/lib/types'

type Translate = (key: string, vars?: Record<string, string | number>) => string

function formatRangeLabel(range: DateRange, type: ReportType): string {
  const useTime = type === 'transactionLog' || type === 'itemizedSales'
  const fromDate = formatReportTimestamp(range.from, false)
  const toDate = formatReportTimestamp(range.to, false)
  const from = useTime && range.fromTime ? `${fromDate} ${range.fromTime}` : fromDate
  const to = useTime && range.toTime ? `${toDate} ${range.toTime}` : toDate
  return `${from} - ${to}`
}

function reportHeader(
  title: string,
  rangeLabel: string,
  t: Translate,
  storeName: string,
): PrintLine[] {
  return [
    { t: 'text', v: storeName, align: 'ct', bold: true, big: true },
    { t: 'text', v: title, align: 'ct', bold: true },
    { t: 'feed', n: 1 },
    { t: 'row', l: t('print.report.range'), r: rangeLabel },
    { t: 'row', l: t('print.report.generated'), r: formatReportNow() },
    { t: 'hr' },
  ]
}

function methodLabel(t: Translate, method: PaymentMethod): string {
  return t(`pos.methods.${method}`)
}

function paymentLines(t: Translate, totals: PaymentMethodReport): PrintLine[] {
  return [
    { t: 'text', v: t('print.report.byPayment'), bold: true },
    {
      t: 'row',
      l: `${methodLabel(t, 'cash')} (${totals.countCash})`,
      r: formatMoney(totals.cash),
    },
    {
      t: 'row',
      l: `${methodLabel(t, 'card')} (${totals.countCard})`,
      r: formatMoney(totals.card),
    },
    {
      t: 'row',
      l: `${methodLabel(t, 'sinpe')} (${totals.countSinpe})`,
      r: formatMoney(totals.sinpe),
    },
    { t: 'row', l: t('common.total'), r: formatMoney(totals.total), bold: true },
  ]
}

function summaryMetricLines(t: Translate, data: SalesSummaryReport): PrintLine[] {
  return [
    {
      t: 'row',
      l: t('print.report.revenue'),
      r: formatMoney(data.totalRevenue),
      bold: true,
    },
    {
      t: 'row',
      l: t('print.report.totalDiscount'),
      r: `-${formatMoney(data.totalDiscount)}`,
    },
    { t: 'row', l: t('print.report.transactions'), r: String(data.txCount) },
    { t: 'row', l: t('print.report.itemsSold'), r: String(data.itemsSold) },
    { t: 'row', l: t('print.report.returns'), r: String(data.returnsCount) },
    { t: 'row', l: t('print.report.avgTicket'), r: formatMoney(data.avgTicket) },
    {
      t: 'row',
      l: t('reports.summary.grossProfit'),
      r: formatMoney(data.grossProfit),
    },
    { t: 'hr' },
    { t: 'text', v: t('print.cierre.cashTitle'), bold: true },
    { t: 'row', l: t('reports.summary.openingFloat'), r: formatMoney(data.cash.openingFloat) },
    { t: 'row', l: t('reports.summary.cashSales'), r: formatMoney(data.cash.cashSales) },
    { t: 'row', l: t('reports.summary.cashIn'), r: formatMoney(data.cash.cashIn) },
    {
      t: 'row',
      l: t('reports.summary.cashOut'),
      r: `-${formatMoney(data.cash.cashOut)}`,
    },
  ]
}

function topProductLines(t: Translate, rows: TopProductRow[]): PrintLine[] {
  const lines: PrintLine[] = [
    { t: 'text', v: t('print.report.topProducts'), bold: true },
  ]
  if (rows.length === 0) {
    lines.push({ t: 'text', v: t('common.noData') })
    return lines
  }
  for (const row of rows) {
    const profit =
      row.marginPct != null
        ? ` · ${t('reports.top.profit')} ${formatMoney(row.profit)} (${row.marginPct}%)`
        : ''
    lines.push({
      t: 'row',
      l: `${row.name} x${row.quantity}`,
      r: `${formatMoney(row.revenue)}${profit}`,
    })
  }
  return lines
}

function taxSum(
  rows: TaxBreakdownReport['rows'],
  field: 'base' | 'iva' | 'gross',
): number {
  return rows.reduce((sum, row) => sum + row[field], 0)
}

function salePaymentSummaryLines(
  t: Translate,
  payments: SalePaymentSnapshot[],
): PrintLine[] {
  if (payments.length === 0) return [{ t: 'text', v: t('common.dash') }]
  return payments.map((pay) => {
    const label =
      pay.method === 'sinpe' && pay.ref
        ? `${methodLabel(t, pay.method)} (${pay.ref})`
        : methodLabel(t, pay.method)
    return { t: 'row', l: label, r: formatMoney(pay.amount) }
  })
}

function buildSummaryLines(
  data: SalesSummaryReport,
  rangeLabel: string,
  range: DateRange,
  t: Translate,
  storeName: string,
): PrintLine[] {
  const lines = reportHeader(t('reports.types.summary'), rangeLabel, t, storeName)

  if (range.from !== range.to && data.days && data.days.length > 0) {
    for (const day of data.days) {
      lines.push({ t: 'hr' })
      lines.push({
        t: 'text',
        v: t('reports.summary.daySection', {
          date: formatReportTimestamp(day.date, false),
        }),
        bold: true,
      })
      lines.push({
        t: 'row',
        l: t('print.report.revenue'),
        r: formatMoney(day.totalRevenue),
        bold: true,
      })
      lines.push({
        t: 'row',
        l: t('print.report.transactions'),
        r: String(day.txCount),
      })
      lines.push({
        t: 'row',
        l: t('print.report.avgTicket'),
        r: formatMoney(day.avgTicket),
      })
    }
    lines.push({ t: 'hr' })
    lines.push({
      t: 'text',
      v: t('reports.summary.periodTotal'),
      bold: true,
      big: true,
    })
  }

  lines.push(...summaryMetricLines(t, data))
  return lines
}

function buildPaymentReportLines(
  data: PaymentMethodReport,
  rangeLabel: string,
  t: Translate,
  storeName: string,
): PrintLine[] {
  return [
    ...reportHeader(t('reports.types.byPayment'), rangeLabel, t, storeName),
    ...paymentLines(t, data),
  ]
}

function buildTopProductsLines(
  data: TopProductRow[],
  rangeLabel: string,
  t: Translate,
  storeName: string,
): PrintLine[] {
  return [
    ...reportHeader(t('reports.types.topProducts'), rangeLabel, t, storeName),
    ...topProductLines(t, data),
  ]
}

function buildInventoryLines(
  data: InventoryReport,
  rangeLabel: string,
  t: Translate,
  storeName: string,
): PrintLine[] {
  const lines = reportHeader(
    t('reports.types.inventory'),
    rangeLabel,
    t,
    storeName,
  )
  lines.push({
    t: 'row',
    l: t('print.report.inventoryCount'),
    r: String(data.total),
  })
  lines.push({
    t: 'row',
    l: t('print.report.inventoryValue'),
    r: formatMoney(data.totalValue),
    bold: true,
  })
  lines.push({ t: 'hr' })
  for (const row of data.rows) {
    lines.push({ t: 'row', l: row.name, r: String(row.stock) })
  }
  return lines
}

function buildTaxLines(
  data: TaxBreakdownReport,
  rangeLabel: string,
  t: Translate,
  storeName: string,
): PrintLine[] {
  const lines = reportHeader(
    t('reports.types.taxBreakdown'),
    rangeLabel,
    t,
    storeName,
  )
  lines.push({
    t: 'row',
    l: t('reports.tax.regime'),
    r: t(`tax.regime.${data.regime}`),
  })
  lines.push({ t: 'hr' })
  if (data.rows.length === 0) {
    lines.push({ t: 'text', v: t('common.noData') })
    return lines
  }
  for (const row of data.rows) {
    lines.push({
      t: 'text',
      v: `${t(`tax.categories.${row.taxCategory}`)} (${Math.round(row.rate * 100)}%)`,
      bold: true,
    })
    lines.push({ t: 'row', l: t('reports.tax.gross'), r: formatMoney(row.gross) })
    lines.push({ t: 'row', l: t('reports.tax.base'), r: formatMoney(row.base) })
    lines.push({ t: 'row', l: t('reports.tax.iva'), r: formatMoney(row.iva) })
  }
  lines.push({ t: 'hr' })
  lines.push({
    t: 'row',
    l: t('reports.tax.totalBase'),
    r: formatMoney(taxSum(data.rows, 'base')),
    bold: true,
  })
  lines.push({
    t: 'row',
    l: t('reports.tax.totalIva'),
    r: formatMoney(taxSum(data.rows, 'iva')),
    bold: true,
  })
  lines.push({
    t: 'row',
    l: t('reports.tax.totalGross'),
    r: formatMoney(taxSum(data.rows, 'gross')),
    bold: true,
  })
  return lines
}

function buildTransactionLogLines(
  data: TransactionLogReport,
  rangeLabel: string,
  t: Translate,
  storeName: string,
): PrintLine[] {
  const lines = reportHeader(
    t('reports.types.transactionLog'),
    rangeLabel,
    t,
    storeName,
  )
  lines.push({
    t: 'row',
    l: t('print.report.transactions'),
    r: String(data.txCount),
    bold: true,
  })
  lines.push({
    t: 'row',
    l: t('print.report.revenue'),
    r: formatMoney(data.totalRevenue),
    bold: true,
  })
  lines.push({ t: 'hr' })

  if (data.rows.length === 0) {
    lines.push({ t: 'text', v: t('common.noData') })
    return lines
  }

  for (const row of data.rows) {
    const label = row.consecutivo ?? `#${row.saleId}`
    lines.push({
      t: 'row',
      l: label,
      r: formatReportTimestamp(row.createdAt, true),
    })
    lines.push({
      t: 'text',
      v: `${row.cashier}${row.customerName ? ` · ${row.customerName}` : ''}`,
    })
    lines.push(...salePaymentSummaryLines(t, row.payments))
    if (row.discountTotal > 0) {
      lines.push({
        t: 'row',
        l: t('print.receipt.discountTotal'),
        r: `-${formatMoney(row.discountTotal)}`,
      })
    }
    lines.push({
      t: 'row',
      l: t('common.total'),
      r: formatMoney(row.total),
      bold: true,
    })
    lines.push({ t: 'feed', n: 1 })
  }
  return lines
}

function buildItemizedSalesLines(
  data: ItemizedSalesReport,
  rangeLabel: string,
  t: Translate,
  storeName: string,
): PrintLine[] {
  const lines = reportHeader(
    t('reports.types.itemizedSales'),
    rangeLabel,
    t,
    storeName,
  )
  lines.push({
    t: 'row',
    l: t('print.report.transactions'),
    r: String(data.sales.length),
    bold: true,
  })
  lines.push({
    t: 'row',
    l: t('print.report.itemsSold'),
    r: String(data.itemsSold),
    bold: true,
  })
  lines.push({
    t: 'row',
    l: t('print.report.revenue'),
    r: formatMoney(data.totalRevenue),
    bold: true,
  })
  lines.push({ t: 'hr' })

  if (data.sales.length === 0) {
    lines.push({ t: 'text', v: t('common.noData') })
    return lines
  }

  for (const sale of data.sales) {
    const label = sale.consecutivo ?? `#${sale.saleId}`
    lines.push({
      t: 'row',
      l: label,
      r: formatReportTimestamp(sale.createdAt, true),
    })
    lines.push({
      t: 'text',
      v: `${sale.cashier}${sale.customerName ? ` · ${sale.customerName}` : ''}`,
    })
    lines.push(...salePaymentSummaryLines(t, sale.payments))
    if (sale.cartDiscount > 0) {
      lines.push({
        t: 'row',
        l: t('print.cierre.cartDiscount'),
        r: `-${formatMoney(sale.cartDiscount)}`,
      })
    }
    for (const item of sale.items) {
      const barcode = item.barcode ? ` [${item.barcode}]` : ''
      lines.push({
        t: 'row',
        l: `${item.productName}${barcode} x${item.quantity}`,
        r: formatMoney(item.lineTotal),
      })
      if (item.lineDiscount > 0) {
        lines.push({
          t: 'row',
          l: `  ${t('print.receipt.discount')}`,
          r: `-${formatMoney(item.lineDiscount)}`,
        })
      }
    }
    if (sale.discountTotal > 0) {
      lines.push({
        t: 'row',
        l: t('print.receipt.discountTotal'),
        r: `-${formatMoney(sale.discountTotal)}`,
        bold: true,
      })
    }
    lines.push({
      t: 'row',
      l: t('common.total'),
      r: formatMoney(sale.total),
      bold: true,
    })
    lines.push({ t: 'feed', n: 1 })
  }
  return lines
}

export function buildReportPrintLines(
  report: ReportData,
  range: DateRange,
  t: Translate,
  storeName: string,
): PrintLine[] {
  const rangeLabel = formatRangeLabel(range, report.type)

  switch (report.type) {
    case 'summary':
      return buildSummaryLines(report.data, rangeLabel, range, t, storeName)
    case 'byPayment':
      return buildPaymentReportLines(report.data, rangeLabel, t, storeName)
    case 'topProducts':
      return buildTopProductsLines(report.data, rangeLabel, t, storeName)
    case 'inventory':
      return buildInventoryLines(report.data, rangeLabel, t, storeName)
    case 'taxBreakdown':
      return buildTaxLines(report.data, rangeLabel, t, storeName)
    case 'transactionLog':
      return buildTransactionLogLines(report.data, rangeLabel, t, storeName)
    case 'itemizedSales':
      return buildItemizedSalesLines(report.data, rangeLabel, t, storeName)
    default:
      return reportHeader(t('reports.title'), rangeLabel, t, storeName)
  }
}
