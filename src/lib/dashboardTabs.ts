export const DASHBOARD_TABS = ['home', 'analytics', 'inventory', 'team'] as const

export type DashboardTab = (typeof DASHBOARD_TABS)[number]

const TAB_IDS = new Set<string>(DASHBOARD_TABS)

export function parseDashboardTab(value: unknown): DashboardTab {
  if (typeof value === 'string' && TAB_IDS.has(value)) {
    return value as DashboardTab
  }
  return 'home'
}
