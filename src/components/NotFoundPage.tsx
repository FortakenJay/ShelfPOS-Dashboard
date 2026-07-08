import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { StatusPageLayout } from '#/components/StatusPageLayout'
import { Button } from '#/components/ui'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <StatusPageLayout
      title={t('notFound.title')}
      actions={
        <Link to="/dashboard">
          <Button variant="primary" size="lg">
            {t('notFound.backHome')}
          </Button>
        </Link>
      }
    >
      <p className="text-6xl font-extrabold tracking-tight text-slate-200">404</p>
      <p>{t('notFound.description')}</p>
    </StatusPageLayout>
  )
}
