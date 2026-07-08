import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '#/lib/auth'
import { isSuperadminUser } from '#/lib/roles'
import type { OwnerInviteLinkResult } from '#/lib/queries/operator-invites'
import {
  generateOwnerInviteLink,
  OperatorInviteError,
  sendOwnerInviteEmail,
} from '#/lib/queries/operator-invites'
import type { OwnerResetLinkResult } from '#/lib/queries/operator-password-reset'
import {
  generateOwnerResetLink,
  OperatorResetError,
  sendOwnerResetEmail,
} from '#/lib/queries/operator-password-reset'
import { useToast } from '#/lib/toast'
import { OperatorStoresTable } from '#/components/operator/OperatorStoresTable'
import { Button, Field, FullScreenSpinner, Input } from '#/components/ui'

export const Route = createFileRoute('/_app/admin')({
  component: OperatorPortalPage,
})

function inviteErrorKey(code: string): string {
  const known = [
    'unauthorized',
    'forbidden',
    'invalid_email',
    'owner_already_exists',
    'invite_failed',
    'invite_link_failed',
    'secret_key_not_configured',
    'secret_key_invalid',
    'redirect_not_allowed',
    'invite_email_failed',
  ]
  return known.includes(code) ? `operatorPortal.errors.${code}` : 'operatorPortal.errors.invite_failed'
}

function resetErrorKey(code: string): string {
  const known = [
    'unauthorized',
    'forbidden',
    'invalid_email',
    'owner_not_found',
    'reset_failed',
    'reset_link_failed',
    'secret_key_not_configured',
  ]
  return known.includes(code) ? `operatorPortal.resetErrors.${code}` : 'operatorPortal.resetErrors.reset_failed'
}

function OperatorPortalPage() {
  const { t } = useTranslation()
  const { user, session, loading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { show } = useToast()
  const [ownerEmail, setOwnerEmail] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [lastInvite, setLastInvite] = useState<OwnerInviteLinkResult | null>(null)
  const [lastReset, setLastReset] = useState<OwnerResetLinkResult | null>(null)

  const generateLink = useMutation({
    mutationFn: async (email: string) => {
      const token = session?.access_token
      if (!token) throw new OperatorInviteError('unauthorized')
      return generateOwnerInviteLink(token, email)
    },
    onSuccess: (result) => {
      setLastInvite(result)
      show(t('operatorPortal.inviteGenerated'))
      void queryClient.invalidateQueries({ queryKey: ['operator-stores'] })
    },
  })

  const sendEmail = useMutation({
    mutationFn: async (email: string) => {
      const token = session?.access_token
      if (!token) throw new OperatorInviteError('unauthorized')
      return sendOwnerInviteEmail(token, email)
    },
    onSuccess: (result) => {
      if (result.emailFailed && result.actionLink) {
        setLastInvite({
          email: result.email,
          actionLink: result.actionLink,
          expiresAt: result.expiresAt ?? null,
        })
        show(t('operatorPortal.inviteEmailFailedWithLink'))
      } else if (result.sent) {
        show(t('operatorPortal.inviteEmailSent'))
      }
      void queryClient.invalidateQueries({ queryKey: ['operator-stores'] })
    },
  })

  const generateResetLink = useMutation({
    mutationFn: async (email: string) => {
      const token = session?.access_token
      if (!token) throw new OperatorResetError('unauthorized')
      return generateOwnerResetLink(token, email)
    },
    onSuccess: (result) => {
      setLastReset(result)
      show(t('operatorPortal.resetGenerated'))
      void queryClient.invalidateQueries({ queryKey: ['operator-stores'] })
    },
  })

  const sendResetEmail = useMutation({
    mutationFn: async (email: string) => {
      const token = session?.access_token
      if (!token) throw new OperatorResetError('unauthorized')
      return sendOwnerResetEmail(token, email)
    },
    onSuccess: () => {
      show(t('operatorPortal.resetEmailSent'))
      void queryClient.invalidateQueries({ queryKey: ['operator-stores'] })
    },
  })

  useEffect(() => {
    if (!loading && user && !isSuperadminUser(user)) {
      void navigate({ to: '/dashboard', replace: true })
    }
  }, [loading, user, navigate])

  if (loading || !user) return <FullScreenSpinner />
  if (!isSuperadminUser(user)) return <FullScreenSpinner />

  const inviteBusy = generateLink.isPending || sendEmail.isPending
  const resetBusy = generateResetLink.isPending || sendResetEmail.isPending
  const inviteError = generateLink.error ?? sendEmail.error
  const resetError = generateResetLink.error ?? sendResetEmail.error
  const inviteErrorMessage =
    inviteError instanceof OperatorInviteError
      ? t(inviteErrorKey(inviteError.code))
      : inviteError instanceof Error
        ? inviteError.message
        : null
  const resetErrorMessage =
    resetError instanceof OperatorResetError
      ? t(resetErrorKey(resetError.code))
      : resetError instanceof Error
        ? resetError.message
        : null

  const submitGenerate = (): void => {
    const email = ownerEmail.trim()
    if (!email) return
    generateLink.mutate(email)
  }

  const submitSendEmail = (): void => {
    const email = ownerEmail.trim()
    if (!email) return
    sendEmail.mutate(email)
  }

  const submitGenerateReset = (): void => {
    const email = resetEmail.trim()
    if (!email) return
    generateResetLink.mutate(email)
  }

  const submitSendResetEmail = (): void => {
    const email = resetEmail.trim()
    if (!email) return
    sendResetEmail.mutate(email)
  }

  const copyInvite = async (): Promise<void> => {
    if (!lastInvite?.actionLink) return
    try {
      await navigator.clipboard.writeText(lastInvite.actionLink)
      show(t('operatorPortal.inviteCopied'))
    } catch {
      show(t('operatorPortal.inviteCopyFailed'))
    }
  }

  const copyReset = async (): Promise<void> => {
    if (!lastReset?.actionLink) return
    try {
      await navigator.clipboard.writeText(lastReset.actionLink)
      show(t('operatorPortal.resetCopied'))
    } catch {
      show(t('operatorPortal.resetCopyFailed'))
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{t('operatorPortal.title')}</h2>
        <p className="mt-2 text-[15px] text-slate-600">{t('operatorPortal.subtitle')}</p>
      </div>

      {session?.access_token ? (
        <OperatorStoresTable accessToken={session.access_token} />
      ) : null}

      <section className="rounded-xl border-2 border-line bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">{t('operatorPortal.inviteTitle')}</h3>
        <p className="mt-2 text-[15px] text-slate-600">{t('operatorPortal.inviteIntro')}</p>

        <div className="mt-4 space-y-4">
          <Field label={t('operatorPortal.ownerEmail')}>
            <Input
              type="email"
              autoComplete="off"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder={t('operatorPortal.ownerEmailPlaceholder')}
              required
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitGenerate()
                }
              }}
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" disabled={inviteBusy || !ownerEmail.trim()} onClick={submitGenerate}>
              {generateLink.isPending
                ? t('operatorPortal.generating')
                : t('operatorPortal.generateInvite')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={inviteBusy || !ownerEmail.trim()}
              onClick={submitSendEmail}
            >
              {sendEmail.isPending
                ? t('operatorPortal.sending')
                : t('operatorPortal.sendInviteEmail')}
            </Button>
          </div>

          {inviteErrorMessage ? (
            <p className="font-semibold text-danger">{inviteErrorMessage}</p>
          ) : null}
        </div>

        {lastInvite ? (
          <div className="mt-6 space-y-3 rounded-lg border-2 border-line bg-surface/60 p-4">
            <p className="text-[14px] font-semibold text-slate-800">
              {t('operatorPortal.inviteFor', { email: lastInvite.email })}
            </p>
            <p className="break-all font-mono text-[13px] text-slate-700">{lastInvite.actionLink}</p>
            {lastInvite.expiresAt ? (
              <p className="text-[13px] text-slate-500">
                {t('operatorPortal.inviteExpires', {
                  date: new Date(lastInvite.expiresAt).toLocaleString(),
                })}
              </p>
            ) : null}
            <Button type="button" variant="outline" onClick={() => void copyInvite()}>
              {t('operatorPortal.copyInvite')}
            </Button>
          </div>
        ) : null}

        <ol className="mt-6 list-decimal space-y-2 pl-5 text-[14px] text-slate-600">
          <li>{t('operatorPortal.inviteStepShare')}</li>
          <li>{t('operatorPortal.inviteStepOwner')}</li>
          <li>{t('operatorPortal.inviteStepPos')}</li>
        </ol>
      </section>

      <section className="rounded-xl border-2 border-line bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">{t('operatorPortal.resetTitle')}</h3>
        <p className="mt-2 text-[15px] text-slate-600">{t('operatorPortal.resetIntro')}</p>

        <div className="mt-4 space-y-4">
          <Field label={t('operatorPortal.ownerEmail')}>
            <Input
              type="email"
              autoComplete="off"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder={t('operatorPortal.ownerEmailPlaceholder')}
              required
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitGenerateReset()
                }
              }}
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" disabled={resetBusy || !resetEmail.trim()} onClick={submitGenerateReset}>
              {generateResetLink.isPending
                ? t('operatorPortal.resetGenerating')
                : t('operatorPortal.generateReset')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={resetBusy || !resetEmail.trim()}
              onClick={submitSendResetEmail}
            >
              {sendResetEmail.isPending
                ? t('operatorPortal.resetSending')
                : t('operatorPortal.sendResetEmail')}
            </Button>
          </div>

          {resetErrorMessage ? (
            <p className="font-semibold text-danger">{resetErrorMessage}</p>
          ) : null}
        </div>

        {lastReset ? (
          <div className="mt-6 space-y-3 rounded-lg border-2 border-line bg-surface/60 p-4">
            <p className="text-[14px] font-semibold text-slate-800">
              {t('operatorPortal.resetFor', { email: lastReset.email })}
            </p>
            <p className="break-all font-mono text-[13px] text-slate-700">{lastReset.actionLink}</p>
            {lastReset.expiresAt ? (
              <p className="text-[13px] text-slate-500">
                {t('operatorPortal.resetExpires', {
                  date: new Date(lastReset.expiresAt).toLocaleString(),
                })}
              </p>
            ) : null}
            <Button type="button" variant="outline" onClick={() => void copyReset()}>
              {t('operatorPortal.copyReset')}
            </Button>
          </div>
        ) : null}

        <ol className="mt-6 list-decimal space-y-2 pl-5 text-[14px] text-slate-600">
          <li>{t('operatorPortal.resetStepShare')}</li>
          <li>{t('operatorPortal.resetStepOwner')}</li>
        </ol>
      </section>
    </div>
  )
}
