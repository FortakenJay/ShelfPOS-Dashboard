import { buildFacturaHtml } from '#/lib/factura-pdf'
import type { FacturaPdfData } from '#/lib/factura-pdf'

const PAGE_WIDTH_PX = 1123
const PAGE_HEIGHT_PX = 794

export async function downloadFacturaHtml(html: string, filename: string): Promise<void> {
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = `position:fixed;left:-12000px;top:0;width:${PAGE_WIDTH_PX}px;height:${PAGE_HEIGHT_PX}px;border:0`
  document.body.appendChild(iframe)

  const idoc = iframe.contentDocument
  if (!idoc) {
    document.body.removeChild(iframe)
    throw new Error('errors.pdfExportFailed')
  }

  idoc.open()
  idoc.write(html)
  idoc.close()

  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve()
    window.setTimeout(resolve, 400)
  })

  try {
    const pages = idoc.querySelectorAll('.page')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = 297
    const pageH = 210

    const targets = pages.length > 0 ? [...pages] : [idoc.body]

    const canvases = await Promise.all(
      targets.map((target) =>
        html2canvas(target as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: PAGE_WIDTH_PX,
          height: PAGE_HEIGHT_PX,
          windowWidth: PAGE_WIDTH_PX,
          windowHeight: PAGE_HEIGHT_PX,
        }),
      ),
    )

    canvases.forEach((canvas, i) => {
      if (i > 0) pdf.addPage()
      const img = canvas.toDataURL('image/jpeg', 0.92)
      pdf.addImage(img, 'JPEG', 0, 0, pageW, pageH)
    })

    pdf.save(filename)
  } finally {
    document.body.removeChild(iframe)
  }
}

export async function downloadFacturaPdf(data: FacturaPdfData, filename: string): Promise<void> {
  await downloadFacturaHtml(buildFacturaHtml(data), filename)
}

export function facturaExportFilename(consecutivo: string): string {
  const safe = consecutivo.trim().replace(/[^\w#-]+/g, '_') || 'venta'
  return `factura-${safe}.pdf`
}
