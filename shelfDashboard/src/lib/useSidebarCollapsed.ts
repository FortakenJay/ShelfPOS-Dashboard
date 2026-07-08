import { useState } from 'react'

const STORAGE_KEY = 'shelfpos.dashboard.sidebarCollapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function useSidebarCollapsed(): {
  collapsed: boolean
  toggle: () => void
} {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const toggle = (): void => {
    setCollapsed((prev) => {
      const next = !prev
      writeCollapsed(next)
      return next
    })
  }

  return { collapsed, toggle }
}
