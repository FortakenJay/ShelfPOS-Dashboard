import { useEffect } from 'react'
import { redirectAuthCallbackToRoute } from '#/lib/auth-callback-route'

/** Sends invite/reset hash callbacks on the wrong path to /accept-invite or /reset-password. */
export function AuthCallbackRedirect() {
  useEffect(() => {
    redirectAuthCallbackToRoute()
  }, [])
  return null
}
