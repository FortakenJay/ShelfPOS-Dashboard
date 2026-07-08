import { useStore } from '#/lib/store-context'
import { OperatorShell } from '#/components/shell/OperatorShell'
import { OwnerShell } from '#/components/shell/OwnerShell'

export function Shell({ children }: { children: React.ReactNode }) {
  const { isSuperadmin } = useStore()

  if (isSuperadmin) {
    return <OperatorShell>{children}</OperatorShell>
  }

  return <OwnerShell>{children}</OwnerShell>
}
