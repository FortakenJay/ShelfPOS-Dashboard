/** Receipt-style print primitives (matches offline POS PrintLine). */
export type PrintLine =
  | { t: 'text'; v: string; align?: 'lt' | 'ct' | 'rt'; bold?: boolean; big?: boolean }
  | { t: 'row'; l: string; r: string; bold?: boolean }
  | { t: 'barcode'; v: string; align?: 'lt' | 'ct' | 'rt' }
  | { t: 'hr' }
  | { t: 'feed'; n?: number }
