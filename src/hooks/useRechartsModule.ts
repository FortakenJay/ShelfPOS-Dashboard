import { useEffect, useState } from 'react'
import type * as Recharts from 'recharts'

export type RechartsModule = typeof Recharts

let rechartsModulePromise: Promise<RechartsModule> | null = null

function loadRechartsModule(): Promise<RechartsModule> {
  rechartsModulePromise ??= import('recharts')
  return rechartsModulePromise
}

export function useRechartsModule(): RechartsModule | null {
  const [module, setModule] = useState<RechartsModule | null>(null)

  useEffect(() => {
    let active = true
    void loadRechartsModule().then((loaded) => {
      if (active) setModule(loaded)
    })
    return () => {
      active = false
    }
  }, [])

  return module
}
