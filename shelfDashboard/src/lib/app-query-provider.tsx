import { QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { queryClient } from '#/lib/query-client'
import {
  DASHBOARD_CACHE_STORAGE_KEY,
  QUERY_GC_MS,
} from '#/lib/stores'

function createDashboardPersister() {
  if (typeof window === 'undefined') return null
  return createSyncStoragePersister({
    storage: window.sessionStorage,
    key: DASHBOARD_CACHE_STORAGE_KEY,
  })
}

export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [persister] = useState(createDashboardPersister)

  if (!persister) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: QUERY_GC_MS,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.queryKey[0] === 'dashboard' && query.state.status === 'success',
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
