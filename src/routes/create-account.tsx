import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useReducer } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from '#/lib/auth'
import { isSignupInviteValid, signupInviteConfigured } from '#/lib/signup-invite'
import { Button, Field, FullScreenSpinner, Input } from '#/components/ui'
import { AppLogo } from '#/components/AppLogo'
import { LanguageSwitcher } from '#/components/LanguageSwitcher'

export const Route = createFileRoute('/create-account')({
  validateSearch: (search: Record<string, unknown>) => ({
    key: typeof search.key === 'string' ? search.key : '',
  }),
  component: CreateAccountRoute,
})

function CreateAccountRoute() {
  return (
    <AuthProvider>
      <CreateAccountPage />
    </AuthProvider>
  )
}

interface FormState {
  email: string
  password: string
  error: string | null
  info: string | null
  submitting: boolean
}

type FormAction =
  | { type: 'setEmail'; email: string }
  | { type: 'setPassword'; password: string }
  | { type: 'submitStart' }
  | { type: 'submitSuccess' }
  | { type: 'submitError'; error: string }

const initialFormState: FormState = {
  email: '',
  password: '',
  error: null,
  info: null,
  submitting: false,
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'setEmail':
      return { ...state, email: action.email }
    case 'setPassword':
      return { ...state, password: action.password }
    case 'submitStart':
      return { ...state, submitting: true, error: null, info: null }
    case 'submitSuccess':
      return { ...state, submitting: false, info: 'created' }
    case 'submitError':
      return { ...state, submitting: false, error: action.error }
  }
}

function CreateAccountPage() {
  const { t } = useTranslation()
  const { key } = Route.useSearch()
  const { signUp, user, loading, configured } = useAuth()
  const navigate = useNavigate()
  const [form, dispatch] = useReducer(formReducer, initialFormState)

  const inviteOk = signupInviteConfigured() && isSignupInviteValid(key)

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: '/dashboard', replace: true })
    }
  }, [loading, user, navigate])

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chrome p-6 text-center text-white">
        <p>
          <Trans
            i18nKey="login.missingEnv"
            components={{
              code: <code className="rounded bg-surface px-1 text-slate-900" />,
            }}
          />
        </p>
      </div>
    )
  }

  if (loading || user) return <FullScreenSpinner />

  if (!inviteOk) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chrome p-6">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-2xl">
          <AppLogo size="lg" wordmarkVariant="dark" />
          <p className="mt-6 text-[15px] font-semibold text-danger">
            {signupInviteConfigured()
              ? t('createAccount.invalidInvite')
              : t('createAccount.disabled')}
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-[15px] font-semibold text-white hover:bg-primary-dark"
          >
            {t('createAccount.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    dispatch({ type: 'submitStart' })
    const { error: err } = await signUp(form.email.trim(), form.password)
    if (err) {
      dispatch({ type: 'submitError', error: err })
      return
    }
    dispatch({ type: 'submitSuccess' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-chrome p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl">
        <AppLogo size="lg" wordmarkVariant="dark" />
        <p className="mt-1 text-[14px] text-slate-500">{t('createAccount.subtitle')}</p>
        <div className="mt-4">
          <LanguageSwitcher variant="light" />
        </div>

        {form.info === 'created' ? (
          <div className="mt-8 space-y-4">
            <p className="text-[15px] font-semibold text-cta">{t('createAccount.success')}</p>
            <Link
              to="/login"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-md bg-primary px-6 text-lg font-semibold text-white hover:bg-primary-dark"
            >
              {t('createAccount.goLogin')}
            </Link>
          </div>
        ) : (
          <form className="mt-8" onSubmit={(e) => void submit(e)}>
            <Field label={t('login.email')}>
              <Input
                type="email"
                autoComplete="username"
                value={form.email}
                onChange={(e) => dispatch({ type: 'setEmail', email: e.target.value })}
                required
              />
            </Field>
            <Field label={t('login.password')} error={form.error ?? undefined}>
              <Input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => dispatch({ type: 'setPassword', password: e.target.value })}
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
              {form.submitting ? t('login.submitting') : t('createAccount.submit')}
            </Button>
            <p className="mt-4 text-center text-[14px] text-slate-600">
              <Link to="/login" className="font-semibold text-primary hover:underline">
                {t('createAccount.alreadyHaveAccount')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
