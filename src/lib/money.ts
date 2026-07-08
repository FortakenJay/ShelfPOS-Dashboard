function formatColones(n: number, symbol: string): string {
  const truncated = Math.trunc(n)
  const sign = truncated < 0 ? '-' : ''
  const amount = Math.abs(truncated)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${sign}${symbol}${amount}`
}

export function formatMoney(n: number): string {
  return formatColones(n, '₡')
}

/** ASCII-safe colones for jsPDF (Helvetica cannot render ₡). */
export function formatMoneyPdf(n: number): string {
  return formatColones(n, 'CRC ')
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}
