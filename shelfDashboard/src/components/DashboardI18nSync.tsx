import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { readStoredLanguage } from '#/lib/i18n'

function htmlLang(code: string): string {
  return code === 'zh-CN' ? 'zh' : 'es'
}

export function DashboardI18nSync({
  children,
}: {
  children: React.ReactNode
}) {
  const { i18n } = useTranslation()

  useEffect(() => {
    const stored = readStoredLanguage()
    if (stored !== i18n.language) {
      void i18n.changeLanguage(stored)
    }
  }, [i18n])

  useEffect(() => {
    const syncHtmlLang = (lng: string): void => {
      document.documentElement.lang = htmlLang(lng)
    }
    syncHtmlLang(i18n.language)
    i18n.on('languageChanged', syncHtmlLang)
    return () => i18n.off('languageChanged', syncHtmlLang)
  }, [i18n])

  return <>{children}</>
}
