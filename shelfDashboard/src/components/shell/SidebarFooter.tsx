import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '#/components/LanguageSwitcher'
import { NavIcon } from '#/components/NavIcon'

export function SidebarFooter({
  collapsed,
  onLogout,
}: {
  collapsed: boolean
  onLogout: () => void
}): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div
      className={`flex shrink-0 flex-col gap-4 border-t border-chrome-light ${
        collapsed ? 'px-2 py-3' : 'p-4'
      }`}
    >
      <LanguageSwitcher compact={collapsed} />
      <button
        type="button"
        onClick={onLogout}
        title={collapsed ? t('nav.logout') : undefined}
        aria-label={collapsed ? t('nav.logout') : undefined}
        className={`flex w-full items-center justify-center rounded-md border border-slate-600 font-semibold text-slate-300 hover:bg-chrome-light hover:text-white ${
          collapsed ? 'px-2 py-2' : 'bg-danger/90 px-3 py-2.5 text-[15px] text-white hover:bg-danger'
        }`}
      >
        {collapsed ? <NavIcon name="logout" /> : t('nav.logout')}
      </button>
    </div>
  )
}
