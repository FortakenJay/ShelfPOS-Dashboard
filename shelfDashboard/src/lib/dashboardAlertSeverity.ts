import type { DashboardAlert } from '#/lib/types'

/** Full-width alert cards on the dashboard panel. */
export function panelAlertSeverityClass(
  severity: DashboardAlert['severity'],
): string {
  if (severity === 'danger') return 'border-danger/40 bg-red-50'
  if (severity === 'warning') return 'border-warning/40 bg-amber-50'
  return 'border-line bg-slate-50'
}
