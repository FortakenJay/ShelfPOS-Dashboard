import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from '#/locales/es.json'
import zh from '#/locales/zh-CN.json'

export type DashboardLanguage = 'es' | 'zh-CN'

export const LANG_STORAGE_KEY = 'shelfpos_dashboard_lang'

export function readStoredLanguage(): DashboardLanguage {
  if (typeof window === 'undefined') return 'es'
  return localStorage.getItem(LANG_STORAGE_KEY) === 'zh-CN' ? 'zh-CN' : 'es'
}

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    'zh-CN': { translation: zh },
  },
  lng: 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
})

export function setDashboardLanguage(lang: DashboardLanguage): void {
  localStorage.setItem(LANG_STORAGE_KEY, lang)
  void i18n.changeLanguage(lang)
}

export default i18n
