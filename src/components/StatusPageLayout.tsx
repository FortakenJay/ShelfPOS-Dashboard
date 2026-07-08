import type { ReactNode } from 'react'
import { AppLogo } from '#/components/AppLogo'
import { LanguageSwitcher } from '#/components/LanguageSwitcher'

export function StatusPageLayout({
  title,
  children,
  actions,
}: {
  title: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-chrome p-6">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl">
        <AppLogo size="lg" wordmarkVariant="dark" />
        <div className="mt-4">
          <LanguageSwitcher variant="light" />
        </div>
        <h1 className="mt-8 text-2xl font-extrabold text-slate-900">{title}</h1>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-slate-600">
          {children}
        </div>
        {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  )
}
