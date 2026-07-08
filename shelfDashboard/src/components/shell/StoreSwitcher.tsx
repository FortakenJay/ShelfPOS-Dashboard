import { useTranslation } from 'react-i18next'
import type { StoreInfo } from '#/lib/stores'
import type { StorePresence } from '#/lib/types'
import { findPresence } from '#/lib/store-presence'
import { StoreStatusDot } from '#/components/StoreStatusBadge'

export function StoreSwitcher({
  collapsed,
  stores,
  storeId,
  presences,
  onSelect,
}: {
  collapsed: boolean
  stores: StoreInfo[]
  storeId: string
  presences: StorePresence[]
  onSelect: (id: string) => void
}): React.JSX.Element | null {
  const { t } = useTranslation()

  if (stores.length <= 1) return null

  return (
    <div
      className={`border-b border-chrome-light ${collapsed ? 'px-1.5 py-2' : 'px-3 py-4'}`}
    >
      {!collapsed && (
        <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {t('nav.stores')}
        </p>
      )}
      <div className="space-y-1">
        {stores.map(({ storeId: id, label }) => {
          const p = findPresence(presences, id)
          const active = id === storeId
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              title={collapsed ? label : undefined}
              className={`flex w-full items-center rounded-md font-semibold ${
                collapsed
                  ? 'justify-center px-2 py-2.5'
                  : 'justify-between px-3 py-2.5 text-left text-[14px]'
              } ${
                active
                  ? 'bg-primary text-white'
                  : 'text-slate-300 hover:bg-chrome-light'
              }`}
            >
              <span className={`flex items-center ${collapsed ? '' : 'gap-2'}`}>
                <StoreStatusDot online={p?.online ?? false} />
                {!collapsed && label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
