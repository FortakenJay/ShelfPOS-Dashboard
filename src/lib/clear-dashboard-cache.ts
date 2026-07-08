import { queryClient } from '#/lib/query-client'
import { DASHBOARD_CACHE_STORAGE_KEY } from '#/lib/stores'

/** Drop persisted dashboard summaries (call on logout / session loss). */
export function clearPersistedDashboardCache(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(DASHBOARD_CACHE_STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
  queryClient.clear()
}
