import { useNavigate } from '@tanstack/react-router'
import { ReportPagination } from '#/components/reports/ReportPagination'
import type { ReportSearch } from '#/lib/reports-search'

export function ReportInventoryPagination({
  page,
  pageSize,
  total,
  loading,
  search,
}: {
  page: number
  pageSize: number
  total: number
  loading: boolean
  search: ReportSearch
}) {
  const navigate = useNavigate()

  return (
    <ReportPagination
      page={page}
      pageSize={pageSize}
      total={total}
      loading={loading}
      onPageChange={(nextPage) => {
        void navigate({
          to: '/reports',
          search: { ...search, page: nextPage },
          replace: true,
        })
      }}
      onPageSizeChange={(nextPageSize) => {
        void navigate({
          to: '/reports',
          search: { ...search, page: 1, pageSize: nextPageSize },
          replace: true,
        })
      }}
    />
  )
}
