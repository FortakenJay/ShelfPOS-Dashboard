import ExcelJS from 'exceljs'
import { formatDateTime, formatReportNow, formatReportTimestamp } from '#/lib/dates'
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

type CellValue = string | number | null

interface GridTable {
  sectionTitle?: string
  headers: string[]
  rows: CellValue[][]
  moneyColumns?: number[]
  textColumns?: number[]
  footerRow?: CellValue[]
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF1F5F9' },
}

const BORDER_THIN: Partial<ExcelJS.Border> = {
  style: 'thin',
  color: { argb: 'FFE2E8F0' },
}

const MONEY_FMT = '"₡"#,##0'

function triggerDownload(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function formatRangeLabel(range: DateRange, type: ReportType): string {
  const useTime = type === 'transactionLog' || type === 'itemizedSales'
  const fromDate = formatReportTimestamp(range.from, false)
  const toDate = formatReportTimestamp(range.to, false)
  const from = useTime && range.fromTime ? `${fromDate} ${range.fromTime}` : fromDate
  const to = useTime && range.toTime ? `${toDate} ${range.toTime}` : toDate
  return `${from} - ${to}`
}

function methodLabel(t: Translate, method: PaymentMethod): string {
  return t(`pos.methods.${method}`)
}

function formatPaymentMethods(t: Translate, payments: SalePaymentSnapshot[]): string {
  if (payments.length === 0) return t('common.dash')
  return payments.map((p) => methodLabel(t, p.method)).join(', ')
}

function dash(t: Translate, value: string | null | undefined): string {
  return value?.trim() ? value : t('common.dash')
}

function buildSummaryTables(data: SalesSummaryReport, t: Translate): GridTable[] {
  const tables: GridTable[] = []

  if ((data.days?.length ?? 0) > 0) {
    tables.push({
      sectionTitle: t('reports.summary.dailyBreakdown'),
      headers: [
        t('reports.summary.date'),
        t('reports.summary.totalRevenue'),
        t('reports.summary.txCount'),
        t('reports.summary.avgTicket'),
      ],
      rows:
        data.days?.map((day) => [
          formatReportTimestamp(day.date, false),
          day.totalRevenue,
          day.txCount,
          day.avgTicket,
        ]) ?? [],
      moneyColumns: [1, 3],
    })
  }

  tables.push({
    sectionTitle:
      (data.days?.length ?? 0) > 0 ? t('reports.summary.periodTotal') : undefined,
    headers: [t('reports.summary.metric'), t('common.total')],
    rows: [
      [t('reports.summary.totalRevenue'), data.totalRevenue],
      [t('reports.summary.totalDiscount'), data.totalDiscount],
      [t('reports.summary.grossProfit'), data.grossProfit],
      [t('reports.summary.txCount'), data.txCount],
      [t('reports.summary.itemsSold'), data.itemsSold],
      [t('reports.summary.returnsCount'), data.returnsCount],
      [t('reports.summary.avgTicket'), data.avgTicket],
      [t('reports.summary.openingFloat'), data.cash.openingFloat],
      [t('reports.summary.cashSales'), data.cash.cashSales],
      [t('reports.summary.cashIn'), data.cash.cashIn],
      [t('reports.summary.cashOut'), data.cash.cashOut],
    ],
    moneyColumns: [1],
  })

  return tables
}

function buildByPaymentTable(data: PaymentMethodReport, t: Translate): GridTable {
  return {
    headers: [
      t('reports.byPayment.method'),
      t('reports.byPayment.amount'),
      t('reports.byPayment.count'),
    ],
    rows: [
      [t('pos.methods.cash'), data.cash, data.countCash],
      [t('pos.methods.card'), data.card, data.countCard],
      [t('pos.methods.sinpe'), data.sinpe, data.countSinpe],
    ],
    moneyColumns: [1],
    footerRow: [
      t('common.total'),
      data.total,
      data.countCash + data.countCard + data.countSinpe,
    ],
  }
}

function buildTopProductsTable(rows: TopProductRow[], t: Translate): GridTable {
  return {
    headers: [
      t('reports.top.product'),
      t('products.barcode'),
      t('reports.top.qty'),
      t('reports.top.revenue'),
      t('reports.top.profit'),
      t('reports.top.margin'),
    ],
    rows: rows.map((row) => [
      row.name,
      row.barcode,
      row.quantity,
      row.revenue,
      row.profit,
      row.marginPct != null ? `${row.marginPct}%` : t('common.dash'),
    ]),
    moneyColumns: [3, 4],
    textColumns: [1],
  }
}

function buildInventoryTable(data: InventoryReport, t: Translate): GridTable {
  return {
    headers: [
      t('products.name'),
      t('products.category'),
      t('products.price'),
      t('products.stock'),
      t('reports.inventory.value'),
    ],
    rows: data.rows.map((row) => [
      row.name,
      row.category ?? t('common.dash'),
      row.price,
      row.stock,
      row.value,
    ]),
    moneyColumns: [2, 4],
    footerRow: [t('reports.inventory.totalValue'), null, null, null, data.totalValue],
  }
}

function buildTaxTable(data: TaxBreakdownReport, t: Translate): GridTable {
  return {
    sectionTitle: `${t('reports.tax.regime')}: ${t(`tax.regime.${data.regime}`)}`,
    headers: [
      t('reports.tax.category'),
      t('reports.tax.rate'),
      t('reports.tax.gross'),
      t('reports.tax.base'),
      t('reports.tax.iva'),
    ],
    rows: data.rows.map((row) => [
      t(`tax.categories.${row.taxCategory}`),
      `${Math.round(row.rate * 100)}%`,
      row.gross,
      row.base,
      row.iva,
    ]),
    moneyColumns: [2, 3, 4],
    footerRow: [
      t('common.total'),
      null,
      data.totalGross,
      data.totalBase,
      data.totalIva,
    ],
  }
}

function buildTransactionLogTable(data: TransactionLogReport, t: Translate): GridTable {
  return {
    headers: [
      t('common.date'),
      t('reports.transactionLog.receipt'),
      t('reports.transactionLog.cashier'),
      t('reports.transactionLog.customer'),
      t('reports.transactionLog.payment'),
      t('reports.transactionLog.discount'),
      t('common.total'),
    ],
    rows: data.rows.map((row) => [
      formatDateTime(row.createdAt),
      row.consecutivo ?? `#${row.saleId}`,
      row.cashier,
      dash(t, row.customerName),
      formatPaymentMethods(t, row.payments),
      row.discountTotal > 0 ? row.discountTotal : t('common.dash'),
      row.total,
    ]),
    moneyColumns: [5, 6],
    textColumns: [1],
    footerRow: [
      `${t('common.total')} (${data.txCount})`,
      null,
      null,
      null,
      null,
      null,
      data.totalRevenue,
    ],
  }
}

function buildItemizedSalesTable(data: ItemizedSalesReport, t: Translate): GridTable {
  const rows: CellValue[][] = []

  for (const sale of data.sales) {
    const receipt = sale.consecutivo ?? `#${sale.saleId}`
    const date = formatDateTime(sale.createdAt)
    const cashier = sale.cashier
    const customer = dash(t, sale.customerName)
    const payments = formatPaymentMethods(t, sale.payments)

    for (const item of sale.items) {
      rows.push([
        receipt,
        date,
        cashier,
        customer,
        payments,
        item.productName,
        dash(t, item.barcode),
        item.quantity,
        item.unitPrice,
        item.lineDiscount > 0 ? item.lineDiscount : t('common.dash'),
        item.lineTotal,
      ])
    }
  }

  return {
    headers: [
      t('reports.transactionLog.receipt'),
      t('common.date'),
      t('reports.transactionLog.cashier'),
      t('reports.transactionLog.customer'),
      t('reports.transactionLog.payment'),
      t('reports.itemized.product'),
      t('products.barcode'),
      t('reports.itemized.qty'),
      t('reports.itemized.unitPrice'),
      t('reports.itemized.discount'),
      t('common.total'),
    ],
    rows,
    moneyColumns: [8, 9, 10],
    textColumns: [6],
    footerRow: [
      `${t('common.total')} (${data.sales.length} · ${data.itemsSold} ${t('reports.summary.itemsSold')})`,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      data.totalRevenue,
    ],
  }
}

function buildReportTables(report: ReportData, t: Translate): GridTable[] {
  switch (report.type) {
    case 'summary':
      return buildSummaryTables(report.data, t)
    case 'byPayment':
      return [buildByPaymentTable(report.data, t)]
    case 'topProducts':
      return [buildTopProductsTable(report.data, t)]
    case 'inventory':
      return [buildInventoryTable(report.data, t)]
    case 'taxBreakdown':
      return [buildTaxTable(report.data, t)]
    case 'transactionLog':
      return [buildTransactionLogTable(report.data, t)]
    case 'itemizedSales':
      return [buildItemizedSalesTable(report.data, t)]
    default:
      return []
  }
}

function maxColumnCount(tables: GridTable[]): number {
  return Math.max(1, ...tables.map((table) => table.headers.length))
}

function setCellBorder(cell: ExcelJS.Cell): void {
  cell.border = {
    top: BORDER_THIN,
    left: BORDER_THIN,
    bottom: BORDER_THIN,
    right: BORDER_THIN,
  }
}

function writeMetaHeader(
  sheet: ExcelJS.Worksheet,
  colCount: number,
  storeName: string,
  title: string,
  rangeLabel: string,
  t: Translate,
): number {
  const meta: [string, boolean, number][] = [
    [storeName, true, 14],
    [title, true, 12],
    [`${t('print.report.range')}: ${rangeLabel}`, false, 11],
    [`${t('print.report.generated')}: ${formatReportNow()}`, false, 11],
  ]

  let rowIndex = 1
  for (const [text, bold, size] of meta) {
    sheet.mergeCells(rowIndex, 1, rowIndex, colCount)
    const cell = sheet.getRow(rowIndex).getCell(1)
    cell.value = text
    cell.font = { bold, size }
    cell.alignment = { vertical: 'middle' }
    rowIndex += 1
  }
  return rowIndex + 1
}

function writeTable(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  table: GridTable,
  colCount: number,
): number {
  let rowIndex = startRow

  if (table.sectionTitle) {
    sheet.mergeCells(rowIndex, 1, rowIndex, colCount)
    const titleCell = sheet.getRow(rowIndex).getCell(1)
    titleCell.value = table.sectionTitle
    titleCell.font = { bold: true, size: 11 }
    titleCell.fill = HEADER_FILL
    rowIndex += 1
  }

  const headerRow = sheet.getRow(rowIndex)
  table.headers.forEach((header, colIndex) => {
    const cell = headerRow.getCell(colIndex + 1)
    cell.value = header
    cell.font = { bold: true, size: 11 }
    cell.fill = HEADER_FILL
    setCellBorder(cell)
    cell.alignment = { vertical: 'middle' }
  })
  rowIndex += 1

  const moneyCols = new Set(table.moneyColumns ?? [])
  const textCols = new Set(table.textColumns ?? [])

  for (const row of table.rows) {
    const excelRow = sheet.getRow(rowIndex)
    table.headers.forEach((_, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1)
      const value = row[colIndex] ?? ''
      cell.value = value
      if (moneyCols.has(colIndex) && typeof value === 'number') {
        cell.numFmt = MONEY_FMT
        cell.alignment = { horizontal: 'right' }
      }
      if (textCols.has(colIndex)) {
        cell.numFmt = '@'
      }
      setCellBorder(cell)
    })
    rowIndex += 1
  }

  if (table.footerRow) {
    const footerRow = sheet.getRow(rowIndex)
    table.headers.forEach((_, colIndex) => {
      const cell = footerRow.getCell(colIndex + 1)
      const value = table.footerRow?.[colIndex] ?? ''
      cell.value = value
      cell.font = { bold: true }
      if (moneyCols.has(colIndex) && typeof value === 'number') {
        cell.numFmt = MONEY_FMT
        cell.alignment = { horizontal: 'right' }
      }
      setCellBorder(cell)
      cell.fill = HEADER_FILL
    })
    rowIndex += 1
  }

  return rowIndex + 1
}

function autosizeColumns(sheet: ExcelJS.Worksheet, colCount: number): void {
  for (let col = 1; col <= colCount; col += 1) {
    let maxLen = 10
    sheet.eachRow((row) => {
      const value = row.getCell(col).value
      const text =
        value == null
          ? ''
          : typeof value === 'number'
            ? value.toString()
            : String(value)
      maxLen = Math.max(maxLen, Math.min(text.length + 2, 48))
    })
    sheet.getColumn(col).width = maxLen
  }
}

export async function downloadReportGridXlsx(args: {
  report: ReportData
  storeLabel: string
  range: DateRange
  t: Translate
  filename: string
}): Promise<void> {
  const { report, storeLabel, range, t, filename } = args
  const tables = buildReportTables(report, t)
  const colCount = maxColumnCount(tables)
  const title = t(`reports.types.${report.type}`)
  const rangeLabel = formatRangeLabel(range, report.type)
  const sheetName = title.slice(0, 31)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'ShelfPOS Dashboard'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  })

  let rowIndex = writeMetaHeader(sheet, colCount, storeLabel, title, rangeLabel, t)
  for (const table of tables) {
    rowIndex = writeTable(sheet, rowIndex, table, colCount)
  }

  autosizeColumns(sheet, colCount)

  const buffer = await workbook.xlsx.writeBuffer()
  triggerDownload(buffer, filename)
}
