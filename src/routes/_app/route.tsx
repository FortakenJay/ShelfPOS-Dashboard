import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Trans } from 'react-i18next'
import { AuthProvider, useAuth } from '#/lib/auth'
import { StoreProvider } from '#/lib/store-context'
import { AppQueryProvider } from '#/lib/app-query-provider'
import { ToastProvider } from '#/lib/toast'
import { Shell } from '#/components/Shell'
import { FullScreenSpinner } from '#/components/ui'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <AppQueryProvider>
      <ToastProvider>
        <AuthProvider>
          <StoreProvider>
            <AuthedShell />
          </StoreProvider>
        </AuthProvider>
      </ToastProvider>
    </AppQueryProvider>
  )
}

function AuthedShell() {
  const { user, loading, configured } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (configured && !loading && !user) {
      void navigate({ to: '/login', replace: true })
    }
  }, [configured, loading, user, navigate])

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-[16px] font-semibold text-danger">
          <Trans
            i18nKey="login.missingEnvProd"
            components={{
              code: <code className="rounded bg-surface px-1" />,
            }}
          />
        </p>
      </div>
    )
  }

  if (loading || !user) return <FullScreenSpinner />

  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}
