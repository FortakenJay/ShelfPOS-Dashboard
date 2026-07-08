import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '#/lib/auth'
import { completeAuthCallbackErrorKey } from '#/lib/accept-invite-errors'
import {
  establishSessionFromAuthCallback,
  hasAuthCallbackInUrl,
} from '#/lib/complete-auth-callback'
import { getSupabase } from '#/lib/supabase'
import { postLoginPath } from '#/lib/roles'
import { Button, Field, FullScreenSpinner, Input } from '#/components/ui'
import { AppLogo } from '#/components/AppLogo'
import { LanguageSwitcher } from '#/components/LanguageSwitcher'

export type SetPasswordI18nNamespace = 'acceptInvite' | 'resetPassword'

type PagePhase = 'loading' | 'set-password' | 'error'

interface FormState {
  password: string
  confirm: string
  error: string | null
  submitting: boolean
}

type FormAction =
  | { type: 'setPassword'; password: string }
  | { type: 'setConfirm'; confirm: string }
  | { type: 'submitStart' }
  | { type: 'submitError'; error: string }

const initialFormState: FormState = {
  password: '',
  confirm: '',
  error: null,
  submitting: false,
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'setPassword':
      return { ...state, password: action.password }
    case 'setConfirm':
      return { ...state, confirm: action.confirm }
    case 'submitStart':
      return { ...state, submitting: true, error: null }
    case 'submitError':
      return { ...state, submitting: false, error: action.error }
  }
}

export function SetPasswordFromAuthCallback({ i18n }: { i18n: SetPasswordI18nNamespace }) {
  const { t } = useTranslation()
  const { user, loading, configured } = useAuth()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<PagePhase>('loading')
  const [callbackError, setCallbackError] = useState<string | null>(null)
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [form, dispatch] = useReducer(formReducer, initialFormState)
  const aborted = useRef(false)

  useEffect(() => {
    if (!configured || loading) return

    aborted.current = false
    void (async () => {
      const sb = getSupabase()

      if (hasAuthCallbackInUrl()) {
        const result = await establishSessionFromAuthCallback(sb)
        if (aborted.current) return
        if (!result.ok) {
          setCallbackError(result.error)
          setPhase('error')
          return
        }

        const { data: userData } = await sb.auth.getUser()
        setAccountEmail(userData.user?.email ?? null)
        setPhase('set-password')
        return
      }

      const { data } = await sb.auth.getSession()
      if (aborted.current) return
      const email = data.session?.user.email
      if (email) {
        setAccountEmail(email)
        setPhase('set-password')
        return
      }
      setCallbackError('missing_callback')
      setPhase('error')
    })()

    return () => {
      aborted.current = true
    }
  }, [configured, loading])

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chrome p-6 text-center text-white">
        <p>{t('login.missingEnvProd')}</p>
      </div>
    )
  }

  if (loading || phase === 'loading') return <FullScreenSpinner />

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chrome p-6">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-2xl">
          <AppLogo size="lg" wordmarkVariant="dark" />
          <p className="mt-6 text-[15px] font-semibold text-danger">
            {t(completeAuthCallbackErrorKey(callbackError ?? 'missing_callback', i18n))}
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-[15px] font-semibold text-white hover:bg-primary-dark"
          >
            {t(`${i18n}.backToLogin`)}
          </Link>
        </div>
      </div>
    )
  }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (form.password.length < 6) {
      dispatch({ type: 'submitError', error: t(`${i18n}.passwordTooShort`) })
      return
    }
    if (form.password !== form.confirm) {
      dispatch({ type: 'submitError', error: t(`${i18n}.passwordMismatch`) })
      return
    }
    dispatch({ type: 'submitStart' })
    const sb = getSupabase()
    const { data: sessionData } = await sb.auth.getSession()
    if (!sessionData.session) {
      dispatch({ type: 'submitError', error: t(`${i18n}.errors.session_missing`) })
      return
    }
    const { error } = await sb.auth.updateUser({ password: form.password })
    if (error) {
      dispatch({
        type: 'submitError',
        error: t(completeAuthCallbackErrorKey(error.message, i18n)),
      })
      return
    }
    const { data } = await getSupabase().auth.getUser()
    const nextUser = data.user
    void navigate({ to: nextUser ? postLoginPath(nextUser) : '/dashboard', replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-chrome p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl">
        <AppLogo size="lg" wordmarkVariant="dark" />
        <p className="mt-1 text-[14px] text-slate-500">{t(`${i18n}.subtitle`)}</p>
        <div className="mt-4">
          <LanguageSwitcher variant="light" />
        </div>

        <form className="mt-8" onSubmit={(e) => void submit(e)}>
          {accountEmail ?? user?.email ? (
            <Field label={t('login.email')}>
              <Input
                type="email"
                value={accountEmail ?? user?.email ?? ''}
                readOnly
                disabled
                className="bg-surface"
              />
            </Field>
          ) : null}
          <Field label={t(`${i18n}.password`)}>
            <Input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => dispatch({ type: 'setPassword', password: e.target.value })}
              required
              minLength={6}
            />
          </Field>
          <Field label={t(`${i18n}.confirmPassword`)} error={form.error ?? undefined}>
            <Input
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => dispatch({ type: 'setConfirm', confirm: e.target.value })}
              required
              minLength={6}
            />
          </Field>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="mt-2 w-full"
            disabled={form.submitting}
          >
            {form.submitting ? t(`${i18n}.saving`) : t(`${i18n}.submit`)}
          </Button>
        </form>
      </div>
    </div>
  )
}
