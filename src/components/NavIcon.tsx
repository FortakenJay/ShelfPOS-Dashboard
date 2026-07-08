import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Link2,
  LogOut,
  ScrollText,
  ShieldCheck,
  Wallet,
} from 'lucide-react'

export type NavIconName =
  | 'dashboard'
  | 'reports'
  | 'cierre'
  | 'cashMovements'
  | 'audit'
  | 'link'
  | 'operator'
  | 'logout'
  | 'panelExpand'
  | 'panelCollapse'

const ICONS: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  reports: BarChart3,
  cierre: CalendarRange,
  cashMovements: Wallet,
  audit: ScrollText,
  link: Link2,
  operator: ShieldCheck,
  logout: LogOut,
  panelExpand: ChevronRight,
  panelCollapse: ChevronLeft,
}

export function NavIcon({
  name,
  className = 'h-5 w-5',
}: {
  name: NavIconName
  className?: string
}): React.JSX.Element {
  const Icon = ICONS[name]
  return <Icon className={className} aria-hidden strokeWidth={1.75} />
}
