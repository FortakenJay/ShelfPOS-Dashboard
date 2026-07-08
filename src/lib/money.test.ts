import { describe, expect, it } from 'vitest'

import { formatMoney, round2 } from '#/lib/money'

describe('round2', () => {
  it('rounds to two decimal places', () => {
    expect(round2(1.234)).toBe(1.23)
    expect(round2(10.996)).toBe(11)
    expect(round2(0)).toBe(0)
  })
})

describe('formatMoney', () => {
  it('formats colones with thousands separators', () => {
    expect(formatMoney(1500)).toBe('₡1 500')
    expect(formatMoney(-2500)).toBe('-₡2 500')
  })
})
