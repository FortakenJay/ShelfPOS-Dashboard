import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChartLoading } from '#/components/dashboard/ChartLoading'

/** Defers Recharts until the container has measurable width/height (avoids -1 warnings). */
export function ChartFrame({
  heightClass = 'h-56',
  children,
}: {
  heightClass?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const update = (): void => {
      const { width, height } = el.getBoundingClientRect()
      setReady(width > 0 && height > 0)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`${heightClass} min-w-0 w-full`}>
      {ready ? children : <ChartLoading fill />}
    </div>
  )
}
