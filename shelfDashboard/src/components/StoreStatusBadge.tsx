import { useTranslation } from 'react-i18next'
import { RelativeTime } from '#/components/RelativeTime'

export function StoreStatusBadge({
  online,
  lastSeenAt,
  size = 'md',
}: {
  online: boolean
  lastSeenAt: string | null
  size?: 'sm' | 'md'
}) {
  const { t } = useTranslation()
  const dot = online ? 'bg-cta' : 'bg-slate-400'
  const text = online ? t('status.online') : t('status.offline')
  const textSize = size === 'sm' ? 'text-[12px]' : 'text-[13px]'

  return (
    <span
      className={`inline-flex items-center gap-2 ${textSize} font-semibold text-slate-600`}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`}
        aria-hidden
      />
      <span className={online ? 'text-cta' : 'text-slate-500'}>{text}</span>
      {!online && !lastSeenAt ? (
        <span className="font-normal text-slate-400">
          · {t('status.noPosSignal')}
        </span>
      ) : lastSeenAt ? (
        <span className="font-normal text-slate-400">
          · {!online ? `${t('status.lastSignal')} ` : ''}
          <RelativeTime iso={lastSeenAt} />
        </span>
      ) : null}
    </span>
  )
}

export function StoreStatusDot({ online }: { online: boolean }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${online ? 'bg-cta' : 'bg-slate-400'}`}
      title={online ? t('status.online') : t('status.offline')}
    />
  )
}
