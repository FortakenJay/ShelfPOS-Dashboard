import {
  HeadContent,
  Scripts,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router'
import { I18nextProvider } from 'react-i18next'

import appCss from '../styles.css?url'
import i18n from '#/lib/i18n'
import { AuthCallbackRedirect } from '#/components/AuthCallbackRedirect'
import { DashboardI18nSync } from '#/components/DashboardI18nSync'
import { NotFoundPage } from '#/components/NotFoundPage'

export const Route = createRootRoute({
  notFoundComponent: NotFoundPage,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ShelfPOS Admin' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'apple-touch-icon', href: '/icon-192.png' },
    ],
  }),
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <I18nextProvider i18n={i18n}>
          <DashboardI18nSync>
            <AuthCallbackRedirect />
            <div id="app" className="h-full">
              <Outlet />
            </div>
          </DashboardI18nSync>
        </I18nextProvider>
        <Scripts />
      </body>
    </html>
  )
}
