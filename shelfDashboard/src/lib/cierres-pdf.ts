import { formatDateTime } from '#/lib/dates'
import { formatMoneyPdf } from '#/lib/money'
import type { CierreRow } from '#/lib/types'

type Translate = (key: string, vars?: Record<string, string | number>) => string

function valueOrDash(value: string | null | undefined, t: Translate): string {
  return value?.trim() || t('common.dash')
}

export async function downloadCierresPdf(args: {
  rows: CierreRow[]
  storeId: string
  from: string
  to: string
  t: Translate
}): Promise<void> {
  const { rows, storeId, from, to, t } = args
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 48
  const lineHeight = 18

  rows.forEach((cierre, index) => {
    if (index > 0) doc.addPage()

    let y = 56
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(t('cierres.pdf.title'), marginX, y)

    y += lineHeight
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`${t('cierres.pdf.store')}: ${storeId}`, marginX, y)
    y += lineHeight
    doc.text(`${t('cierres.pdf.range')}: ${from} - ${to}`, marginX, y)
    y += lineHeight
    doc.text(
      `${t('cierres.pdf.generatedAt')}: ${new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' })}`,
      marginX,
      y,
    )

    y += lineHeight * 1.5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(`${t('cierres.id')}: ${String(cierre.id)}`, marginX, y)

    const diff = cierre.cash_difference ?? 0
    const rowsText: Array<[string, string]> = [
      [t('cierres.closed'), formatDateTime(cierre.closed_at)],
      [t('cierres.shift'), valueOrDash(cierre.shift_label, t)],
      [t('cierres.cashier'), valueOrDash(cierre.closed_by_username, t)],
      [t('cierres.sales'), formatMoneyPdf(cierre.total_sales ?? 0)],
      [t('cierres.cash'), formatMoneyPdf(cierre.total_cash ?? 0)],
      [t('cierres.card'), formatMoneyPdf(cierre.total_card ?? 0)],
      [t('cierres.sinpe'), formatMoneyPdf(cierre.total_sinpe ?? 0)],
      [t('cierres.difference'), formatMoneyPdf(diff)],
      [t('cierres.notes'), valueOrDash(cierre.notes, t)],
    ]

    y += lineHeight * 1.5
    doc.setFontSize(11)
    rowsText.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(`${label}:`, marginX, y)
      doc.setFont('helvetica', 'normal')
      const wrappedValue = doc.splitTextToSize(value, 380) as string[]
      doc.text(wrappedValue, marginX + 120, y)
      y += Math.max(1, wrappedValue.length) * lineHeight
    })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(
      `${t('cierres.pdf.page')}: ${index + 1}/${rows.length}`,
      marginX,
      doc.internal.pageSize.getHeight() - 32,
    )
  })

  doc.save(`cierres-${storeId}-${from}_to_${to}.pdf`)
}
