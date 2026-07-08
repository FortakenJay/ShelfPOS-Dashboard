import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useReducer } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from '#/lib/auth'
import { postLoginPath } from '#/lib/roles'
import { Button, Field, FullScreenSpinner, Input } from '#/components/ui'
import { AppLogo } from '#/components/AppLogo'
import { LanguageSwitcher } from '#/components/LanguageSwitcher'

export const Route = createFileRoute('/login')({
  component: LoginRoute,
})

function LoginRoute() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  )
}

interface LoginFormState {
  email: string
  password: string
  error: string | null
  submitting: boolean
}

type LoginFormAction =
  | { type: 'setEmail'; email: string }
  | { type: 'setPassword'; password: string }
  | { type: 'submitStart' }
  | { type: 'submitError'; error: string }

const initialLoginFormState: LoginFormState = {
  email: '',
  password: '',
  error: null,
  submitting: false,
}

function loginFormReducer(
  state: LoginFormState,
  action: LoginFormAction,
): LoginFormState {
  switch (action.type) {
    case 'setEmail':
      return { ...state, email: action.email }
    case 'setPassword':
      return { ...state, password: action.password }
    case 'submitStart':
      return { ...state, submitting: true, error: null }
    case 'submitError':
      return { ...state, submitting: false, error: action.error }
  }
}

function LoginPage() {
  const { t } = useTranslation()
  const { signIn, user, loading, configured } = useAuth()
  const navigate = useNavigate()
  const [form, dispatch] = useReducer(loginFormReducer, initialLoginFormState)

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: postLoginPath(user), replace: true })
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

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    dispatch({ type: 'submitStart' })
    const { error: err } = await signIn(form.email.trim(), form.password)
    if (err) {
      dispatch({ type: 'submitError', error: err })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-chrome p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl">
        <AppLogo size="lg" wordmarkVariant="dark" />
        <p className="mt-1 text-[14px] text-slate-500">{t('login.subtitle')}</p>
        <div className="mt-4">
          <LanguageSwitcher variant="light" />
        </div>

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
              autoComplete="current-password"
              value={form.password}
              onChange={(e) =>
                dispatch({ type: 'setPassword', password: e.target.value })
              }
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
            {form.submitting ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>
      </div>
    </div>
  )
}
