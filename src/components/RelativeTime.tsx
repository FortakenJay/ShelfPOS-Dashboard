import { useTranslation } from 'react-i18next'
import { formatRelativeTime } from '#/lib/dates'

export function RelativeTime({
  iso,
  className = '',
}: {
  iso: string | null
  className?: string
}) {
  useTranslation()
  return <span className={className}>{formatRelativeTime(iso)}</span>
}
