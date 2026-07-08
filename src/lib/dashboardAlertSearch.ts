import type { DashboardAlert } from '#/lib/types'
import type { DashboardTab } from '#/lib/dashboardTabs'
import { daysAgoLocal, todayLocal } from '#/lib/dates'

/** Maps dashboard alerts to route search params. */
export function dashboardAlertSearch(
  alert: DashboardAlert,
): { tab: DashboardTab } | { from: string; to: string } | undefined {
  switch (alert.kind) {
    case 'low_stock':
    case 'out_of_stock':
    case 'negative_stock':
      return { tab: 'inventory' }
    case 'cierre_discrepancy':
      return { from: daysAgoLocal(30), to: todayLocal() }
    default:
      return undefined
  }
}
