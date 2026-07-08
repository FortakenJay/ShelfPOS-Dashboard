export type StoreId = string

export interface StoreInfo {
  storeId: StoreId
  label: string
}

/** POS considered online if heartbeat within one missed beat + poll buffer. */
export const POS_ONLINE_THRESHOLD_MS = 45_000

/** How often the shell polls store presence (keep ≥ threshold). */
export const PRESENCE_POLL_MS = 30_000

/** Background refresh for dashboard data (heavy queries — keep slow). */
export const DASHBOARD_POLL_MS = 120_000

/** React Query: skip refetch-on-mount/focus while dashboard data is still fresh. */
export const DASHBOARD_STALE_MS = DASHBOARD_POLL_MS

/** React Query: skip refetch-on-mount/focus while presence is still fresh. */
export const PRESENCE_STALE_MS = PRESENCE_POLL_MS

/** How long to keep unused query results in memory after unmount. */
export const QUERY_GC_MS = 600_000

/** Store list changes rarely (sync registers new stores). */
export const STORES_STALE_MS = 300_000

/** Paginated product catalog (~25k rows) — memory cache only, not persisted. */
export const DASHBOARD_PRODUCTS_STALE_MS = 600_000

/** sessionStorage key for persisted dashboard summary (small payload). */
export const DASHBOARD_CACHE_STORAGE_KEY = 'shelfpos-dashboard-cache'
