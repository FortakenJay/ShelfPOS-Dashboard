import { round2 } from '#/lib/money'
import type {
  AuditRow,
  DashboardEmployeeOverview,
  DashboardEmployeePerformanceRow,
  DashboardRole,
  DashboardRoleSummary,
  DashboardTeamMember,
} from '#/lib/types'

const ROLE_DESCRIPTION_KEYS: Record<DashboardRole, string> = {
  admin: 'dashboard.roles.adminDesc',
  sales: 'dashboard.roles.salesDesc',
  product_manager: 'dashboard.roles.pmDesc',
}

export type PosUserRow = {
  id: number
  username: string | null
  role: DashboardRole | string | null
  is_active: number | null
}

type SaleWithUser = {
  user_id: number | null
  total: number | null
}

function isEmployeeAuditAction(action: string): boolean {
  return (
    action === 'login' ||
    action === 'logout' ||
    action.startsWith('user_') ||
    action.startsWith('pin_')
  )
}

function isActivePosUser(row: PosUserRow): boolean {
  return Number(row.is_active) === 1
}

function parsePosUserRole(role: PosUserRow['role']): DashboardRole | null {
  if (role === 'admin' || role === 'sales' || role === 'product_manager') return role
  return null
}

export function roleSummariesFromPosUsers(users: PosUserRow[]): DashboardRoleSummary[] {
  const counts = new Map<DashboardRole, number>()
  for (const user of users) {
    if (!isActivePosUser(user)) continue
    const role = parsePosUserRole(user.role)
    if (!role) continue
    counts.set(role, (counts.get(role) ?? 0) + 1)
  }

  return (['admin', 'sales', 'product_manager'] as DashboardRole[]).map((role) => ({
    role,
    count: counts.get(role) ?? 0,
    descriptionKey: ROLE_DESCRIPTION_KEYS[role],
  }))
}

export function teamMembersFromPosUsers(users: PosUserRow[]): DashboardTeamMember[] {
  return users
    .map((user) => ({
      id: user.id,
      username: user.username?.trim() || `Usuario #${user.id}`,
      role: parsePosUserRole(user.role),
      isActive: isActivePosUser(user),
    }))
    .sort((a, b) => a.username.localeCompare(b.username, 'es'))
}

export function buildEmployeeOverviewFromPosUsers(
  users: PosUserRow[],
): DashboardEmployeeOverview {
  const activeUsers = users.filter(isActivePosUser)
  const roleSummaries = roleSummariesFromPosUsers(users)
  return {
    totalEmployees: users.length,
    activeEmployees: activeUsers.length,
    roleCounts: roleSummaries.map((r) => ({ role: r.role, count: r.count })),
  }
}

export function employeePerformanceFromSales(
  sales: SaleWithUser[],
  usernameByUserId: Map<number, string>,
  roleByUserId: Map<number, DashboardRole>,
): DashboardEmployeePerformanceRow[] {
  const byUser = new Map<number, { transactions: number; salesVolume: number }>()

  for (const sale of sales) {
    const userId = sale.user_id
    if (userId == null) continue
    const role = roleByUserId.get(userId)
    if (role !== 'sales') continue
    const existing = byUser.get(userId) ?? { transactions: 0, salesVolume: 0 }
    existing.transactions++
    existing.salesVolume += sale.total ?? 0
    byUser.set(userId, existing)
  }

  return [...byUser.entries()]
    .map(([userId, stats]) => ({
      userId,
      username: usernameByUserId.get(userId) ?? `Usuario #${userId}`,
      role: 'sales' as const,
      transactions: stats.transactions,
      salesVolume: round2(stats.salesVolume),
      avgTicket:
        stats.transactions > 0
          ? round2(stats.salesVolume / stats.transactions)
          : 0,
    }))
    .sort((a, b) => b.salesVolume - a.salesVolume)
}

export function posUserRoleMap(users: PosUserRow[]): Map<number, DashboardRole> {
  const map = new Map<number, DashboardRole>()
  for (const user of users) {
    const role = parsePosUserRole(user.role)
    if (role) map.set(user.id, role)
  }
  return map
}

export function posUserUsernameMap(users: PosUserRow[]): Map<number, string> {
  const map = new Map<number, string>()
  for (const user of users) {
    const username = user.username?.trim()
    if (username) map.set(user.id, username)
  }
  return map
}

export function recentEmployeeActivity(auditRows: AuditRow[]): AuditRow[] {
  return auditRows.filter((row) => isEmployeeAuditAction(row.action)).slice(0, 10)
}

export const EMPTY_DASHBOARD_TEAM = {
  employees: {
    totalEmployees: 0,
    activeEmployees: 0,
    roleCounts: [] as DashboardEmployeeOverview['roleCounts'],
  },
  teamMembers: [] as DashboardTeamMember[],
  employeePerformance: [] as DashboardEmployeePerformanceRow[],
  roleSummaries: [] as DashboardRoleSummary[],
  recentEmployeeActivity: [] as AuditRow[],
  activeUsernames: 0,
} as const
