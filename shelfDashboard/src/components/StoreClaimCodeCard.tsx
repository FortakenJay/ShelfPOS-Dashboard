import { useTranslation } from 'react-i18next'
import { Button } from '#/components/ui'
import { useToast } from '#/lib/toast'

export function StoreClaimCodeCard({
  code,
  loading,
  error,
  onRegenerate,
  regenerating,
  showRegenerate = true,
}: {
  code: string | null
  loading: boolean
  error: string | null
  onRegenerate?: () => void
  regenerating?: boolean
  showRegenerate?: boolean
}) {
  const { t } = useTranslation()
  const { show } = useToast()

  const copyCode = async (): Promise<void> => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      show(t('linkPos.copied'))
    } catch {
      /* clipboard optional */
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border-2 border-line bg-white p-6">
        <p className="text-[15px] text-slate-600">{t('linkPos.generating')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 border-line bg-white p-6">
      {error && <p className="mb-4 font-semibold text-danger">{error}</p>}

      {code ? (
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-5">
          <p className="text-[13px] font-bold uppercase tracking-widest text-primary">
            {t('linkPos.codeLabel')}
          </p>
          <p className="mt-2 font-mono text-3xl font-extrabold tracking-[0.2em] text-slate-900">
            {code}
          </p>
          <p className="mt-2 text-[14px] text-slate-600">{t('linkPos.codeExpiry')}</p>
          <p className="mt-3 text-[15px] text-slate-700">{t('linkPos.codeInstallerHint')}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="primary" onClick={() => void copyCode()}>
              {t('linkPos.copy')}
            </Button>
            {showRegenerate && onRegenerate && (
              <Button
                type="button"
                variant="outline"
                disabled={regenerating}
                onClick={onRegenerate}
              >
                {regenerating ? t('linkPos.generating') : t('linkPos.regenerate')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        showRegenerate &&
        onRegenerate && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={regenerating}
            onClick={onRegenerate}
          >
            {regenerating ? t('linkPos.generating') : t('linkPos.generate')}
          </Button>
        )
      )}
    </div>
  )
}
