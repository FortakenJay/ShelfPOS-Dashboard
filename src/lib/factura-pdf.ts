/** Factura grid PDF (landscape A4) — same layout as offline POS admin export. */

const ROWS_PER_PAGE = 16

export interface FacturaPdfItem {
  productId: number | null
  barcode: string | null
  name: string
  quantity: number
  unitPrice: number
  lineDiscount: number
  lineTotal: number
}

export interface FacturaPdfCustomer {
  name: string | null
  id: string | null
}

export interface FacturaPdfData {
  storeName: string
  consecutivo: string
  createdAt: string
  printedAt: string
  cashier: string
  customer: FacturaPdfCustomer
  subtotal: number
  discountTotal: number
  total: number
  items: FacturaPdfItem[]
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatFacturaAmount(n: number): string {
  const v = Math.round(n * 100) / 100
  const sign = v < 0 ? '-' : ''
  const [intPart, decPart = '00'] = Math.abs(v).toFixed(2).split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${sign}${withCommas}.${decPart}`
}

function formatFacturaQty(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function lineDiscountPercent(unitPrice: number, qty: number, lineDiscount: number): number {
  const gross = unitPrice * qty
  if (gross <= 0 || lineDiscount <= 0) return 0
  return Math.round((lineDiscount / gross) * 10000) / 100
}

const FACTURA_TZ = 'America/Costa_Rica'

const FACTURA_DATETIME_FMT = new Intl.DateTimeFormat('sv-SE', {
  timeZone: FACTURA_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export function formatFacturaDateTime(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '—'
  if (trimmed.includes('T')) {
    try {
      return FACTURA_DATETIME_FMT.format(new Date(trimmed))
    } catch {
      return trimmed.slice(0, 19).replace('T', ' ')
    }
  }
  return trimmed.slice(0, 19)
}

export function facturaPrintTimestamp(): string {
  return FACTURA_DATETIME_FMT.format(new Date())
}

function formatDocumentNumber(consecutivo: string): string {
  const trimmed = consecutivo.trim()
  if (/^P\s*#/i.test(trimmed)) return trimmed.replace(/^P\s*#/i, 'P#')
  return `P#${trimmed}`
}

function itemCodeCell(productId: number | null, barcode: string | null): string {
  const b = barcode?.trim()
  if (b && b.length >= 12 && /^\d+$/.test(b)) {
    return escapeHtml(b.slice(6, 12))
  }
  if (productId != null && productId > 0) return escapeHtml(String(productId))
  if (b) return escapeHtml(b)
  return '—'
}

function itemBarcodeCell(barcode: string | null): string {
  if (!barcode) return '—'
  return escapeHtml(barcode)
}

function buildTableRows(items: FacturaPdfItem[], startIndex: number): string {
  return items
    .map((item, i) => {
      const rowNum = startIndex + i + 1
      const pct = lineDiscountPercent(item.unitPrice, item.quantity, item.lineDiscount)
      return `<tr>
        <td class="num">${rowNum}</td>
        <td class="code">${itemCodeCell(item.productId, item.barcode)}</td>
        <td class="code">${itemBarcodeCell(item.barcode)}</td>
        <td class="detail">${escapeHtml(item.name)}</td>
        <td class="num">${formatFacturaQty(item.quantity)}</td>
        <td class="num">${formatFacturaAmount(item.unitPrice)}</td>
        <td class="num">${formatFacturaAmount(pct)}</td>
        <td class="num">${formatFacturaAmount(item.lineTotal)}</td>
      </tr>`
    })
    .join('')
}

function buildSummaryBlock(data: FacturaPdfData): string {
  return `<div class="summary">
    <div class="summary-row">
      <span>Subtotal</span>
      <span>${formatFacturaAmount(data.subtotal)}</span>
    </div>
    <div class="summary-row">
      <span>Descuento</span>
      <span>${formatFacturaAmount(data.discountTotal)}</span>
    </div>
    <div class="summary-row summary-total">
      <span>Total</span>
      <span>${formatFacturaAmount(data.total)}</span>
    </div>
  </div>`
}

function buildPage(
  data: FacturaPdfData,
  pageItems: FacturaPdfItem[],
  pageIndex: number,
  pageCount: number,
  startIndex: number,
  showSummary: boolean,
): string {
  const documentNumber = escapeHtml(formatDocumentNumber(data.consecutivo))
  const customerName = data.customer.name ? escapeHtml(data.customer.name) : '—'
  const customerId = data.customer.id ? escapeHtml(data.customer.id) : '—'
  const issueDate = formatFacturaDateTime(data.createdAt)
  const printDate = formatFacturaDateTime(data.printedAt)

  return `<section class="page">
    <header class="hdr">
      <div class="hdr-meta">
        <div><span class="lbl">document_number:</span> <strong>${documentNumber}</strong></div>
        <div><span class="lbl">currency:</span> CRC</div>
        <div><span class="lbl">issue_date:</span> ${issueDate}</div>
        <div><span class="lbl">print_date:</span> ${printDate}</div>
        <div><span class="lbl">client:</span> ${customerName}</div>
        <div><span class="lbl">identification:</span> ${customerId}</div>
        <div><span class="lbl">page:</span> ${pageIndex + 1}/${pageCount}</div>
      </div>
      <div class="hdr-store">
        <div class="store">${escapeHtml(data.storeName)}</div>
        <div class="cashier">Cajero: ${escapeHtml(data.cashier)}</div>
      </div>
    </header>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Código</th>
          <th>Código Barra</th>
          <th>Detalle</th>
          <th>Cant</th>
          <th>Precio</th>
          <th>Desc%</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${buildTableRows(pageItems, startIndex)}
      </tbody>
    </table>
    ${showSummary ? buildSummaryBlock(data) : ''}
  </section>`
}

function buildFacturaPages(data: FacturaPdfData): string[] {
  const pages: string[] = []
  const items = data.items
  const pageCount = Math.max(1, Math.ceil(items.length / ROWS_PER_PAGE))

  if (items.length === 0) {
    pages.push(buildPage(data, [], 0, 1, 0, true))
  } else {
    for (let p = 0; p < pageCount; p++) {
      const slice = items.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE)
      const isLast = p === pageCount - 1
      pages.push(buildPage(data, slice, p, pageCount, p * ROWS_PER_PAGE, isLast))
    }
  }
  return pages
}

const FACTURA_HTML_STYLE = `
  * { box-sizing: border-box; }
  @page { size: A4 landscape; margin: 10mm; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 9px;
    color: #111;
    margin: 0;
    padding: 0;
  }
  .page {
    page-break-after: always;
    min-height: 100%;
  }
  .page:last-child { page-break-after: auto; }
  .hdr {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 8px;
    font-size: 9px;
    line-height: 1.5;
  }
  .hdr-meta .lbl { color: #444; }
  .hdr-store { text-align: right; }
  .store { font-weight: 700; font-size: 11px; }
  .cashier { margin-top: 4px; color: #333; }
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  th, td {
    border: 1px solid #333;
    padding: 3px 4px;
    vertical-align: top;
    word-wrap: break-word;
  }
  th {
    background: #e8e8e8;
    font-weight: 700;
    text-align: center;
    font-size: 8px;
  }
  td.num { text-align: right; }
  td.code { font-family: Consolas, monospace; font-size: 8px; text-align: left; }
  td.detail { text-align: left; }
  th:nth-child(1), td:nth-child(1) { width: 4%; }
  th:nth-child(2), td:nth-child(2) { width: 8%; }
  th:nth-child(3), td:nth-child(3) { width: 12%; }
  th:nth-child(4), td:nth-child(4) { width: 30%; }
  th:nth-child(5), td:nth-child(5) { width: 6%; }
  th:nth-child(6), td:nth-child(6) { width: 10%; }
  th:nth-child(7), td:nth-child(7) { width: 8%; }
  th:nth-child(8), td:nth-child(8) { width: 12%; }
  .summary {
    margin-top: 10px;
    margin-left: auto;
    width: 240px;
    font-size: 10px;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
    border-bottom: 1px solid #ccc;
  }
  .summary-total {
    font-weight: 700;
    font-size: 11px;
    border-bottom: 2px solid #333;
    margin-top: 2px;
  }
`

export function buildFacturaHtml(data: FacturaPdfData): string {
  return buildCombinedFacturaHtml([data])
}

export function buildCombinedFacturaHtml(documents: FacturaPdfData[]): string {
  const pages = documents.flatMap((doc) => buildFacturaPages(doc))
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>${FACTURA_HTML_STYLE}</style>
</head>
<body>${pages.join('')}</body>
</html>`
}
