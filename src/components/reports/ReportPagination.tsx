import { useTranslation } from 'react-i18next'
import { Button } from '#/components/ui'

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const

export function ReportPagination({
  page,
  pageSize,
  total,
  loading,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  loading?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const { t } = useTranslation()

  if (total === 0) return null

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const from = (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[14px] text-slate-600">
        {t('products.pagination.showing', { from, to, total })}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[14px] text-slate-600">
          <span>{t('products.pagination.perPage')}</span>
          <select
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={loading}
            className="min-h-[44px] rounded-md border-2 border-line bg-white px-2 text-[15px] outline-none focus:border-primary"
            aria-label={t('products.pagination.perPage')}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <span className="text-[14px] text-slate-600">
          {t('products.pagination.pageOf', { page: safePage, totalPages })}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={safePage <= 1 || loading}
            onClick={() => onPageChange(safePage - 1)}
          >
            {t('common.back')}
          </Button>
          <Button
            variant="outline"
            disabled={safePage >= totalPages || loading}
            onClick={() => onPageChange(safePage + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
