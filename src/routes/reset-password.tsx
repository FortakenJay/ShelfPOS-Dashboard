import { createFileRoute } from '@tanstack/react-router'
import { AuthProvider } from '#/lib/auth'
import { SetPasswordFromAuthCallback } from '#/components/SetPasswordFromAuthCallback'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  return (
    <AuthProvider>
      <SetPasswordFromAuthCallback i18n="resetPassword" />
    </AuthProvider>
  )
}
