import { QueryClient } from '@tanstack/react-query'
import { DASHBOARD_STALE_MS, QUERY_GC_MS } from '#/lib/stores'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: DASHBOARD_STALE_MS,
      gcTime: QUERY_GC_MS,
      refetchOnWindowFocus: false,
    },
  },
})
