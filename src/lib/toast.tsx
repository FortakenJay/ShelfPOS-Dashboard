import { createContext, use, useState } from 'react'
import type { ReactNode } from 'react'

const ToastContext = createContext<(message: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)

  const show = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(null), 2500)
  }

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message ? (
        <output className="fixed bottom-6 left-1/2 z-[100] block -translate-x-1/2 rounded-lg bg-slate-900 px-5 py-3 text-[15px] font-semibold text-white shadow-lg">
          {message}
        </output>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast(): { show: (message: string) => void } {
  const show = use(ToastContext)
  return { show }
}
