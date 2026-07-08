import type { NavIconName } from '#/components/NavIcon'

export type ShellNavItem = {
  to: string
  labelKey: string
  icon: NavIconName
  search?: { tab: 'home' }
}

export const OWNER_NAV: ShellNavItem[] = [
  {
    to: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: 'dashboard',
    search: { tab: 'home' },
  },
  { to: '/reports', labelKey: 'nav.reports', icon: 'reports' },
  { to: '/cierres', labelKey: 'nav.cierres', icon: 'cierre' },
  { to: '/movements', labelKey: 'nav.cashMovements', icon: 'cashMovements' },
  { to: '/audit', labelKey: 'nav.audit', icon: 'audit' },
  { to: '/link-pos', labelKey: 'nav.linkPos', icon: 'link' },
]

const OWNER_APP_PATHS = [
  '/dashboard',
  '/reports',
  '/cierres',
  '/movements',
  '/audit',
  '/link-pos',
] as const

export function isOwnerAppPath(pathname: string): boolean {
  return OWNER_APP_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}

export const OPERATOR_PLATFORM_NAV: ShellNavItem[] = [
  { to: '/admin', labelKey: 'nav.operatorPortal', icon: 'operator' },
]

export function navLinkClass(collapsed: boolean, active: boolean): string {
  const base = collapsed
    ? 'flex items-center justify-center px-2 py-3'
    : 'block px-4 py-3 text-[15px]'
  const state = active
    ? 'bg-primary text-white'
    : 'text-slate-300 hover:bg-chrome-light hover:text-white'
  return `rounded-md font-semibold ${base} ${state}`
}

export function isNavItemActive(pathname: string, to: string): boolean {
  return (
    pathname === to ||
    pathname.startsWith(`${to}/`) ||
    (to === '/dashboard' && pathname === '/dashboard')
  )
}

export function isOperatorPortalPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}
