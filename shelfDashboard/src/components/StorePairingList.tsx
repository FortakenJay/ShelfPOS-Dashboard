import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Field, Input } from '#/components/ui'
import { createStorePairing } from '#/lib/queries/store-claims'

export function StorePairingList({
  pairings,
  loading,
  onCopy,
}: {
  pairings: Array<{ pairingCode: string; label: string | null; expiresAt: string }>
  loading: boolean
  onCopy: (code: string) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [label, setLabel] = useState('')

  const addPairing = useMutation({
    mutationFn: () => createStorePairing(label.trim() || undefined),
    onSuccess: () => {
      setLabel('')
      void queryClient.invalidateQueries({ queryKey: ['store-pairings'] })
      void queryClient.invalidateQueries({ queryKey: ['store-claim', 'active'] })
    },
  })

  if (loading) {
    return <p className="text-[15px] text-slate-600">{t('linkPos.generating')}</p>
  }

  return (
    <div className="space-y-4">
      {pairings.length === 0 ? (
        <p className="text-[15px] text-slate-600">{t('linkPos.noPending')}</p>
      ) : (
        <ul className="space-y-3">
          {pairings.map((p) => (
            <li
              key={p.pairingCode}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-primary/20 bg-primary/5 px-4 py-3"
            >
              <div>
                {p.label ? (
                  <p className="text-[13px] font-bold uppercase tracking-wide text-primary">
                    {p.label}
                  </p>
                ) : null}
                <p className="font-mono text-2xl font-extrabold tracking-[0.15em] text-slate-900">
                  {p.pairingCode}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => onCopy(p.pairingCode)}>
                {t('linkPos.copy')}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-end">
        <Field
          label={t('linkPos.labelOptional')}
          className="mb-0 min-w-0 flex-1 sm:min-w-[200px]"
        >
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('linkPos.labelPlaceholder')}
          />
        </Field>
        <Button
          type="button"
          variant="primary"
          className="w-full shrink-0 sm:w-auto"
          disabled={addPairing.isPending}
          onClick={() => addPairing.mutate()}
        >
          {addPairing.isPending ? t('linkPos.generating') : t('linkPos.addRegister')}
        </Button>
      </div>
    </div>
  )
}
