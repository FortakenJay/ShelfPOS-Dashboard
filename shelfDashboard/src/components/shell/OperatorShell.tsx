import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '#/lib/auth'
import { useSidebarCollapsed } from '#/lib/useSidebarCollapsed'
import { AppLogo } from '#/components/AppLogo'
import { NavIcon } from '#/components/NavIcon'
import { SidebarFooter } from '#/components/shell/SidebarFooter'
import { SidebarNav } from '#/components/shell/SidebarNav'
import { OPERATOR_PLATFORM_NAV } from '#/components/shell/nav'

export function OperatorShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { collapsed, toggle } = useSidebarCollapsed()

  const logout = async (): Promise<void> => {
    await signOut()
    void navigate({ to: '/login' })
  }

  return (
    <div className="flex h-full min-h-screen">
      <aside
        className={`flex shrink-0 flex-col overflow-hidden bg-chrome text-white transition-[width] duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div
          className={`shrink-0 border-b border-chrome-light ${collapsed ? 'px-2 py-3' : 'px-4 py-5'}`}
        >
          <div
            className={`flex items-center ${
              collapsed ? 'flex-col gap-2' : 'justify-between gap-2'
            }`}
          >
            <AppLogo
              className={collapsed ? 'justify-center' : 'min-w-0'}
              size={collapsed ? 'sm' : 'md'}
              showWordmark={!collapsed}
            />
            <button
              type="button"
              onClick={toggle}
              title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
              aria-label={
                collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')
              }
              className="flex shrink-0 items-center justify-center rounded-md border border-slate-600 p-2 text-slate-300 hover:bg-chrome-light hover:text-white"
            >
              <NavIcon name={collapsed ? 'panelExpand' : 'panelCollapse'} />
            </button>
          </div>
          {!collapsed && (
            <p className="mt-2 text-[12px] font-semibold uppercase tracking-widest text-slate-500">
              {t('nav.operatorBadge')}
            </p>
          )}
        </div>

        <nav
          className={`min-h-0 flex-1 space-y-4 overflow-y-auto py-4 ${
            collapsed ? 'px-1.5' : 'px-3'
          }`}
        >
          <SidebarNav
            collapsed={collapsed}
            pathname={pathname}
            sectionLabel={t('nav.operatorMenu')}
            items={OPERATOR_PLATFORM_NAV}
          />
        </nav>

        <SidebarFooter collapsed={collapsed} onLogout={() => void logout()} />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-auto bg-surface">
        <header className="border-b-2 border-line bg-white px-6 py-4">
          <h1 className="text-xl font-bold text-slate-900">
            {t('nav.operatorPortal')}
          </h1>
        </header>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  )
}
