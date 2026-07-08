import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { StorePairingList } from '#/components/StorePairingList'
import { listPendingPairings } from '#/lib/queries/store-claims'
import { useToast } from '#/lib/toast'

export const Route = createFileRoute('/_app/link-pos')({
  component: LinkPosPage,
})

function LinkPosPage() {
  const { t } = useTranslation()
  const { show } = useToast()
  const queryClient = useQueryClient()

  const copyPairingCode = async (code: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code)
      show(t('linkPos.copied'))
    } catch {
      /* optional */
    }
  }

  const {
    data: pairings = [],
    isPending: listLoading,
    error: listError,
  } = useQuery({
    queryKey: ['store-pairings'],
    queryFn: listPendingPairings,
    staleTime: 30_000,
  })

  return (
    <div className="p-6">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900">{t('linkPos.title')}</h1>
        <p className="mt-2 text-[15px] text-slate-600">{t('linkPos.description')}</p>

        <ol className="mt-6 list-decimal space-y-3 pl-5 text-[15px] text-slate-700">
          <li>{t('linkPos.stepCopy')}</li>
          <li>{t('linkPos.stepInstaller')}</li>
          <li>{t('linkPos.stepRefresh')}</li>
        </ol>

        <div className="mt-8 rounded-xl border-2 border-line bg-white p-6">
          {listError instanceof Error ? (
            <p className="mb-4 font-semibold text-danger">{listError.message}</p>
          ) : null}

          <StorePairingList
            pairings={pairings}
            loading={listLoading}
            onCopy={(c) => void copyPairingCode(c)}
          />
        </div>

        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex min-h-10 items-center rounded-md border-2 border-line bg-white px-4 py-2 text-[15px] font-semibold text-slate-800 hover:border-primary"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ['stores'] })
            }}
          >
            {t('linkPos.goDashboard')}
          </Link>
        </div>
      </div>
    </div>
  )
}
