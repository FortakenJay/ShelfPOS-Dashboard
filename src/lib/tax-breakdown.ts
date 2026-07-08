import { round2 } from '#/lib/money'
import type { TaxBreakdownReport, TaxCategory } from '#/lib/reports.types'

const IVA_RATE_STANDARD = 0.13

function taxRateForCategory(category: string): number {
  return category === 'standard' ? IVA_RATE_STANDARD : 0
}

type TaxLineItem = {
  line_total: number | null
  tax_category?: string | null
}

export function buildTaxBreakdownFromLineItems(
  items: TaxLineItem[],
): TaxBreakdownReport {
  const byCat = new Map<string, number>()
  for (const item of items) {
    const catKey = item.tax_category?.trim() || 'standard'
    byCat.set(catKey, round2((byCat.get(catKey) ?? 0) + (item.line_total ?? 0)))
  }
  const rows = [...byCat.entries()].map(([catKey, gross]) => {
    const rate = taxRateForCategory(catKey)
    const base = rate > 0 ? round2(gross / (1 + rate)) : gross
    return {
      taxCategory: catKey as TaxCategory,
      rate,
      gross,
      base,
      iva: round2(gross - base),
    }
  })
  return {
    regime: 'simplificado',
    rows,
    totalGross: round2(rows.reduce((s, r) => s + r.gross, 0)),
    totalBase: round2(rows.reduce((s, r) => s + r.base, 0)),
    totalIva: round2(rows.reduce((s, r) => s + r.iva, 0)),
  }
}
