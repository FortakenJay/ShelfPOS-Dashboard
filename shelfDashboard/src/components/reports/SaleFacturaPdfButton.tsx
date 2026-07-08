import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '#/components/ui'
import { downloadFacturaPdf, facturaExportFilename } from '#/lib/download-factura-pdf'
import { fetchFacturaPdfData } from '#/lib/queries/factura-pdf'
import { useStore } from '#/lib/store-context'

export function SaleFacturaPdfButton({
  saleId,
  consecutivo,
  size = 'sm',
  className = '',
}: {
  saleId: number
  consecutivo?: string | null
  size?: 'sm' | 'md'
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation()
  const { storeId, storeLabel } = useStore()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const onExport = (): void => {
    if (busy) return
    setBusy(true)
    setFailed(false)
    void fetchFacturaPdfData(storeId, saleId, storeLabel)
      .then((data) =>
        downloadFacturaPdf(data, facturaExportFilename(consecutivo ?? data.consecutivo)),
      )
      .catch(() => setFailed(true))
      .finally(() => setBusy(false))
  }

  return (
    <Button
      size={size}
      variant="outline"
      onClick={onExport}
      disabled={busy}
      title={failed ? t('errors.facturaPdfFailed') : undefined}
      className={`whitespace-nowrap ${className}`.trim()}
    >
      {busy ? t('reports.facturaPdf.exporting') : t('reports.facturaPdf.download')}
    </Button>
  )
}
