import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setDashboardLanguage } from '#/lib/i18n'
import type { DashboardLanguage } from '#/lib/i18n'

const LANGUAGES: DashboardLanguage[] = ['es', 'zh-CN']

function languageShortLabel(lang: DashboardLanguage): string {
  return lang === 'es' ? 'Español' : '中文'
}

export function LanguageSwitcher({
  className = '',
  variant = 'dark',
  compact = false,
}: {
  className?: string
  variant?: 'dark' | 'light'
  compact?: boolean
}): React.JSX.Element {
  const { t, i18n: i18nInstance } = useTranslation()
  const [busy, setBusy] = useState(false)
  const lang = i18nInstance.language === 'zh-CN' ? 'zh-CN' : 'es'

  const styles =
    variant === 'dark'
      ? 'border-slate-500 bg-chrome-light'
      : 'border-line bg-white'

  const activeStyles =
    variant === 'dark'
      ? 'bg-primary text-white'
      : 'bg-primary text-white'

  const inactiveStyles =
    variant === 'dark'
      ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'

  const select = (code: DashboardLanguage): void => {
    if (busy || code === lang) return
    setBusy(true)
    void Promise.resolve(setDashboardLanguage(code)).finally(() => setBusy(false))
  }

  if (compact) {
    const next = lang === 'es' ? 'zh-CN' : 'es'
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => select(next)}
        title={t('common.switchLanguage')}
        aria-label={t('common.switchLanguage')}
        className={`min-h-10 w-full rounded-md border-2 px-3 py-2 text-[14px] font-semibold disabled:opacity-60 ${styles} ${className}`}
      >
        <span className={variant === 'dark' ? 'text-white' : 'text-slate-900'}>
          {lang === 'es' ? 'ES' : '中'}
        </span>
      </button>
    )
  }

  return (
    <fieldset
      className={`m-0 inline-flex min-w-0 w-full overflow-hidden rounded-md border-2 p-0 ${styles} ${className}`}
    >
      <legend className="sr-only">{t('common.switchLanguage')}</legend>
      {LANGUAGES.map((code) => {
        const active = code === lang
        return (
          <button
            key={code}
            type="button"
            disabled={busy}
            onClick={() => select(code)}
            aria-pressed={active}
            className={`min-h-10 flex-1 px-3 py-2 text-[14px] font-semibold disabled:opacity-60 ${
              active ? activeStyles : inactiveStyles
            }`}
          >
            {languageShortLabel(code)}
          </button>
        )
      })}
    </fieldset>
  )
}
