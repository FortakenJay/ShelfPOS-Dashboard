import { round2 } from '#/lib/money'
import type { TaxBreakdownReport, TaxCategory } from '#/lib/reports.types'

/** Fallback when a store's stores.iva_rate_standard mirror row hasn't synced yet. */
const DEFAULT_IVA_RATE_STANDARD = 0.13

function taxRateForCategory(category: string, ivaRateStandard: number): number {
  return category === 'standard' ? ivaRateStandard : 0
}

type TaxLineItem = {
  line_total: number | null
  tax_category?: string | null
}

/**
 * ivaRateStandard is a fraction (e.g. 0.13), sourced from the store's configurable
 * iva_rate_standard setting so this can never drift from what the POS actually
 * charged (audit P2-N3 — this used to be hardcoded to 13% here).
 */
export function buildTaxBreakdownFromLineItems(
  items: TaxLineItem[],
  ivaRateStandard: number = DEFAULT_IVA_RATE_STANDARD,
): TaxBreakdownReport {
  const byCat = new Map<string, number>()
  for (const item of items) {
    const catKey = item.tax_category?.trim() || 'standard'
    byCat.set(catKey, round2((byCat.get(catKey) ?? 0) + (item.line_total ?? 0)))
  }
  const rows = [...byCat.entries()].map(([catKey, gross]) => {
    const rate = taxRateForCategory(catKey, ivaRateStandard)
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
