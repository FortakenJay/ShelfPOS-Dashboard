import type { PrintLine } from '#/lib/reports/print-line.types'

const CONTENT_WIDTH_MM = 80
const MARGIN_LEFT_MM = 65
const PAGE_BOTTOM_MM = 285
const LINE_HEIGHT_MM = 5

function pdfSafeText(value: string): string {
  return value.replace(/₡/g, 'CRC ')
}

export async function downloadPrintLinesPdf(
  lines: PrintLine[],
  filename: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  let y = 15

  function ensureSpace(extra = LINE_HEIGHT_MM): void {
    if (y + extra > PAGE_BOTTOM_MM) {
      doc.addPage()
      y = 15
    }
  }

  for (const line of lines) {
    if (line.t === 'feed') {
      y += LINE_HEIGHT_MM * (line.n ?? 1)
      continue
    }

    if (line.t === 'hr') {
      ensureSpace(6)
      y += 2
      doc.setDrawColor(100, 116, 139)
      doc.setLineDashPattern([1, 1.5], 0)
      doc.line(MARGIN_LEFT_MM, y, MARGIN_LEFT_MM + CONTENT_WIDTH_MM, y)
      doc.setLineDashPattern([], 0)
      y += 4
      continue
    }

    if (line.t === 'text' || line.t === 'barcode') {
      const fontSize = line.t === 'text' && line.big ? 14 : 10
      const isBold = line.t === 'text' ? (line.bold ?? false) : false
      ensureSpace(fontSize * 0.45 + 2)
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      doc.setFontSize(fontSize)
      const align = line.align ?? (line.t === 'barcode' ? 'ct' : 'lt')
      const x =
        align === 'ct'
          ? MARGIN_LEFT_MM + CONTENT_WIDTH_MM / 2
          : align === 'rt'
            ? MARGIN_LEFT_MM + CONTENT_WIDTH_MM
            : MARGIN_LEFT_MM
      doc.text(pdfSafeText(line.v), x, y, {
        align: align === 'ct' ? 'center' : align === 'rt' ? 'right' : 'left',
        maxWidth: CONTENT_WIDTH_MM,
      })
      y += fontSize * 0.45 + 2
      continue
    }

    doc.setFont('helvetica', line.bold ? 'bold' : 'normal')
    doc.setFontSize(10)
    const leftWidth = CONTENT_WIDTH_MM * 0.35
    const rightWidth = CONTENT_WIDTH_MM * 0.65
    const leftLines = doc.splitTextToSize(pdfSafeText(line.l), leftWidth)
    const rightLines = doc.splitTextToSize(pdfSafeText(line.r), rightWidth)
    const rowLines = Math.max(leftLines.length, rightLines.length)
    ensureSpace(LINE_HEIGHT_MM * rowLines)
    for (let i = 0; i < rowLines; i += 1) {
      const lineY = y + i * LINE_HEIGHT_MM
      if (leftLines[i]) {
        doc.text(leftLines[i], MARGIN_LEFT_MM, lineY)
      }
      if (rightLines[i]) {
        doc.text(rightLines[i], MARGIN_LEFT_MM + CONTENT_WIDTH_MM, lineY, {
          align: 'right',
        })
      }
    }
    y += LINE_HEIGHT_MM * rowLines
  }

  doc.save(filename)
}
