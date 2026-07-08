import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getAuthCallbackRoute } from '#/lib/auth-callback-route'
import { FullScreenSpinner } from '#/components/ui'

export const Route = createFileRoute('/')({
  component: IndexRoute,
})

function IndexRoute() {
  const navigate = useNavigate()

  useEffect(() => {
    const callbackRoute = getAuthCallbackRoute()
    if (callbackRoute) {
      window.location.replace(`${callbackRoute}${window.location.search}${window.location.hash}`)
      return
    }
    void navigate({ to: '/dashboard', replace: true })
  }, [navigate])

  return <FullScreenSpinner />
}
