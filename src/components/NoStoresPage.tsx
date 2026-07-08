import { useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '#/lib/auth'
import { StatusPageLayout } from '#/components/StatusPageLayout'
import { StoreClaimCodeCard } from '#/components/StoreClaimCodeCard'
import { Button } from '#/components/ui'
import { ensureStorePairingCode, createStorePairing } from '#/lib/queries/store-claims'

export function NoStoresPage({
  onRetry,
  retrying,
  loadFailed,
}: {
  onRetry: () => void
  retrying: boolean
  loadFailed: boolean
}) {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: claimCode,
    isPending: claimLoading,
    error: claimError,
  } = useQuery({
    queryKey: ['store-claim', 'active'],
    queryFn: ensureStorePairingCode,
    enabled: !loadFailed,
    staleTime: 60_000,
  })

  const regenerate = useMutation({
    mutationFn: createStorePairing,
    onSuccess: (code) => {
      queryClient.setQueryData(['store-claim', 'active'], code)
    },
  })

  const logout = async (): Promise<void> => {
    await signOut()
    void navigate({ to: '/login', replace: true })
  }

  return (
    <StatusPageLayout
      title={t('errors.noStoresTitle')}
      actions={
        <>
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={retrying}
            onClick={onRetry}
          >
            {retrying ? t('common.refreshing') : t('errors.noStoresRefresh')}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => void logout()}>
            {t('nav.logout')}
          </Button>
        </>
      }
    >
      {loadFailed ? (
        <p className="font-semibold text-danger">{t('errors.noStoresLoadFailed')}</p>
      ) : (
        <>
          <p className="text-[15px] text-slate-700">{t('errors.noStoresIntro')}</p>

          <StoreClaimCodeCard
            code={claimCode ?? null}
            loading={claimLoading}
            error={
              claimError instanceof Error
                ? claimError.message
                : regenerate.error instanceof Error
                  ? regenerate.error.message
                  : null
            }
            onRegenerate={() => regenerate.mutate()}
            regenerating={regenerate.isPending}
          />

          <div className="rounded-lg border-2 border-line bg-surface/60 p-4">
            <p className="mb-3 font-semibold text-slate-800">{t('errors.noStoresChecklistTitle')}</p>
            <ol className="list-decimal space-y-2 pl-5 text-slate-700">
              <li>{t('errors.noStoresStepInstall')}</li>
              <li>{t('errors.noStoresStepCode')}</li>
              <li>{t('errors.noStoresStepFinish')}</li>
            </ol>
          </div>
        </>
      )}
    </StatusPageLayout>
  )
}
