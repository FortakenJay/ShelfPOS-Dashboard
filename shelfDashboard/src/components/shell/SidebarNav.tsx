import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { NavIcon } from '#/components/NavIcon'
import type { ShellNavItem } from '#/components/shell/nav'
import { isNavItemActive, navLinkClass } from '#/components/shell/nav'

export function SidebarNav({
  collapsed,
  pathname,
  sectionLabel,
  items,
}: {
  collapsed: boolean
  pathname: string
  sectionLabel: string
  items: ShellNavItem[]
}): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="space-y-1">
      {!collapsed && (
        <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {sectionLabel}
        </p>
      )}
      {items.map((item) => {
        const active = isNavItemActive(pathname, item.to)
        return (
          <Link
            key={item.to}
            to={item.to}
            search={item.search}
            title={collapsed ? t(item.labelKey) : undefined}
            className={navLinkClass(collapsed, active)}
          >
            {collapsed ? (
              <NavIcon name={item.icon} />
            ) : (
              t(item.labelKey)
            )}
          </Link>
        )
      })}
    </div>
  )
}
