import {
  createContext,
  use,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '#/lib/auth'
import { isSuperadminUser } from '#/lib/roles'
import { fetchStores } from '#/lib/queries/stores'
import { QUERY_GC_MS, STORES_STALE_MS } from '#/lib/stores'
import type { StoreId, StoreInfo } from '#/lib/stores'
import { isOwnerAppPath, isOperatorPortalPath } from '#/components/shell/nav'
import { FullScreenSpinner } from '#/components/ui'
import { NoStoresPage } from '#/components/NoStoresPage'

interface StoreContextValue {
  stores: StoreInfo[]
  storeId: StoreId
  storeLabel: string
  setStoreId: (id: StoreId) => void
  isSuperadmin: boolean
}

const StoreContext = createContext<StoreContextValue | null>(null)

const STORAGE_KEY = 'shelfpos_dashboard_store'

function resolveStoreId(stores: StoreInfo[]): StoreId {
  if (!stores.length) return ''
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && stores.some((s) => s.storeId === stored)) return stored
  return stores[0].storeId
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const isSuperadmin = isSuperadminUser(user)
  const allowWithoutStore =
    isOperatorPortalPath(pathname) || (!isSuperadmin && pathname === '/link-pos')

  const { data: stores = [], isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['stores', user?.id],
    queryFn: fetchStores,
    enabled: !authLoading && Boolean(user) && !isSuperadmin,
    staleTime: STORES_STALE_MS,
    gcTime: QUERY_GC_MS,
    refetchIntervalInBackground: false,
  })

  const [storeIdOverride, setStoreIdOverride] = useState<StoreId | null>(null)
  const resolvedStoreId = storeIdOverride ?? resolveStoreId(stores)

  const setStoreId = (id: StoreId): void => {
    setStoreIdOverride(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const storeLabel =
    stores.find((s) => s.storeId === resolvedStoreId)?.label ?? resolvedStoreId

  const value: StoreContextValue =
    allowWithoutStore && stores.length === 0
      ? { stores, storeId: '', storeLabel: '', setStoreId, isSuperadmin }
      : { stores, storeId: resolvedStoreId, storeLabel, setStoreId, isSuperadmin }

  useEffect(() => {
    if (authLoading || !user || !isSuperadmin) return
    if (isOperatorPortalPath(pathname)) return
    if (isOwnerAppPath(pathname) || pathname === '/link-pos') {
      void navigate({ to: '/admin', replace: true })
    }
  }, [authLoading, user, isSuperadmin, pathname, navigate])

  useEffect(() => {
    if (authLoading || user) return
    void navigate({ to: '/login', replace: true })
  }, [authLoading, user, navigate])

  const waitingForStores =
    Boolean(user) && isPending && stores.length === 0 && !isSuperadmin

  let body: ReactNode
  if (authLoading || waitingForStores) {
    body = <FullScreenSpinner />
  } else if (!user) {
    body = <FullScreenSpinner />
  } else if (!isSuperadmin && !allowWithoutStore && (isError || stores.length === 0)) {
    body = (
      <NoStoresPage
        loadFailed={isError}
        retrying={isFetching}
        onRetry={() => {
          void refetch()
        }}
      />
    )
  } else if (!allowWithoutStore && !resolvedStoreId) {
    body = <FullScreenSpinner />
  } else if (isSuperadmin && !isOperatorPortalPath(pathname)) {
    body = <FullScreenSpinner />
  } else {
    body = children
  }

  return <StoreContext.Provider value={value}>{body}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = use(StoreContext)
  if (!ctx) throw new Error('useStore outside StoreProvider')
  return ctx
}
