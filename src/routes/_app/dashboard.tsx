import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useStore } from '#/lib/store-context'
import { DASHBOARD_POLL_MS, DASHBOARD_STALE_MS, QUERY_GC_MS } from '#/lib/stores'
import { fetchDashboardCached, fetchDashboardTeam } from '#/lib/queries/dashboard'
import { EMPTY_DASHBOARD_TEAM } from '#/lib/dashboard-employees'
import { parseDashboardTab } from '#/lib/dashboardTabs'
import { DashboardTabNav } from '#/components/dashboard/DashboardTabNav'
import { DashboardTabContent } from '#/components/dashboard/DashboardViews'
import { Button, FullScreenSpinner } from '#/components/ui'

export const Route = createFileRoute('/_app/dashboard')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: parseDashboardTab(search.tab),
  }),
  component: DashboardPage,
})

function DashboardPage() {
  const { t } = useTranslation()
  const { storeId } = useStore()
  const queryClient = useQueryClient()
  const { tab } = Route.useSearch()
  const {
    data: core,
    isPending,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard', storeId],
    queryFn: () => fetchDashboardCached(storeId, queryClient),
    staleTime: DASHBOARD_STALE_MS,
    gcTime: QUERY_GC_MS,
    refetchInterval: DASHBOARD_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })

  const {
    data: team,
    isPending: teamPending,
    isError: teamError,
    refetch: refetchTeam,
  } = useQuery({
    queryKey: ['dashboard-team', storeId],
    queryFn: () => fetchDashboardTeam(storeId),
    enabled: tab === 'team' && Boolean(storeId),
    staleTime: DASHBOARD_STALE_MS,
    gcTime: QUERY_GC_MS,
    refetchInterval: tab === 'team' ? DASHBOARD_POLL_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })

  if (isPending || !core) return <FullScreenSpinner />

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6">
        <p className="font-semibold text-danger">{t('errors.loadDashboard')}</p>
        <Button variant="outline" onClick={() => void refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  const data =
    tab === 'team' && !teamError
      ? { ...core, ...(team ?? EMPTY_DASHBOARD_TEAM) }
      : core

  return (
    <div className="min-h-full bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-6 py-3">
        <DashboardTabNav />
        <button
          type="button"
          onClick={() => {
            void refetch()
            if (tab === 'team') void refetchTeam()
          }}
          className="shrink-0 text-[13px] font-semibold text-primary hover:underline"
        >
          {isFetching ? t('common.refreshing') : t('common.refresh')}
        </button>
      </div>
      <DashboardTabContent
        tab={tab}
        data={data}
        teamLoading={tab === 'team' && teamPending}
        teamError={tab === 'team' && teamError}
        onRetryTeam={() => void refetchTeam()}
      />
    </div>
  )
}
