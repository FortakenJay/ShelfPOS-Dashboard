import { createFileRoute } from '@tanstack/react-router'
import { AuthProvider } from '#/lib/auth'
import { SetPasswordFromAuthCallback } from '#/components/SetPasswordFromAuthCallback'

export const Route = createFileRoute('/accept-invite')({
  component: AcceptInviteRoute,
})

function AcceptInviteRoute() {
  return (
    <AuthProvider>
      <SetPasswordFromAuthCallback i18n="acceptInvite" />
    </AuthProvider>
  )
}
