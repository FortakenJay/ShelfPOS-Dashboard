import ExcelJS from 'exceljs'
import type { PrintLine } from '#/lib/reports/print-line.types'

const COL_A = 1
const COL_B = 2

function looksLikeLongId(value: string): boolean {
  return /^\d{10,}$/.test(value.trim())
}

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

export async function downloadPrintLinesXlsx(
  lines: PrintLine[],
  filename: string,
  sheetName: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'ShelfPOS Dashboard'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(sheetName.slice(0, 31), {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    },
  })

  sheet.columns = [{ width: 42 }, { width: 28 }]

  let rowIndex = 1

  for (const line of lines) {
    if (line.t === 'feed') {
      rowIndex += line.n ?? 1
      continue
    }

    if (line.t === 'hr') {
      const row = sheet.getRow(rowIndex)
      sheet.mergeCells(rowIndex, COL_A, rowIndex, COL_B)
      row.getCell(COL_A).border = {
        bottom: { style: 'mediumDashed', color: { argb: 'FF64748B' } },
      }
      rowIndex += 1
      continue
    }

    if (line.t === 'text') {
      const row = sheet.getRow(rowIndex)
      sheet.mergeCells(rowIndex, COL_A, rowIndex, COL_B)
      const cell = row.getCell(COL_A)
      cell.value = line.v
      cell.font = {
        bold: line.bold ?? false,
        size: line.big ? 16 : 11,
      }
      cell.alignment = {
        horizontal:
          line.align === 'ct' ? 'center' : line.align === 'rt' ? 'right' : 'left',
        vertical: 'middle',
      }
      rowIndex += 1
      continue
    }

    if (line.t === 'barcode') {
      const row = sheet.getRow(rowIndex)
      sheet.mergeCells(rowIndex, COL_A, rowIndex, COL_B)
      const cell = row.getCell(COL_A)
      cell.value = line.v
      cell.numFmt = '@'
      cell.alignment = {
        horizontal:
          line.align === 'ct' ? 'center' : line.align === 'rt' ? 'right' : 'left',
      }
      rowIndex += 1
      continue
    }

    const row = sheet.getRow(rowIndex)
    const leftCell = row.getCell(COL_A)
    const rightCell = row.getCell(COL_B)
    leftCell.value = line.l
    rightCell.value = line.r
    leftCell.font = { bold: line.bold ?? false }
    rightCell.font = { bold: line.bold ?? false }
    leftCell.alignment = { horizontal: 'left', vertical: 'middle' }
    rightCell.alignment = { horizontal: 'right', vertical: 'middle' }
    if (looksLikeLongId(line.l)) leftCell.numFmt = '@'
    if (looksLikeLongId(line.r)) rightCell.numFmt = '@'
    rowIndex += 1
  }

  const buffer = await workbook.xlsx.writeBuffer()
  triggerDownload(buffer, filename)
}
