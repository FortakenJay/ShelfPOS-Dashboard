import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'

type ButtonVariant = 'primary' | 'cta' | 'danger' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark disabled:bg-slate-400',
  cta: 'bg-cta text-white hover:bg-cta-dark disabled:bg-slate-400',
  danger: 'bg-danger text-white hover:bg-danger-dark disabled:bg-slate-400',
  outline:
    'border-2 border-line bg-white text-slate-900 hover:border-primary hover:text-primary disabled:text-slate-400',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-200 disabled:text-slate-400',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] px-3 py-1.5 text-[13px]',
  md: 'min-h-[44px] px-4 text-[15px]',
  lg: 'min-h-[52px] px-6 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    />
  )
}

export function Input({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-[44px] w-full rounded-md border-2 border-line bg-white px-3 text-[16px] outline-none focus:border-primary ${className}`}
      {...rest}
    />
  )
}

export function Select({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`min-h-[44px] w-full rounded-md border-2 border-line bg-white px-3 text-[16px] outline-none focus:border-primary ${className}`}
      {...rest}
    >
      {children}
    </select>
  )
}

export function Field({
  label,
  error,
  children,
  className = '',
}: {
  label: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={className ? `block ${className}` : 'mb-4 block'}>
      <span className="mb-1 block text-[15px] font-semibold text-slate-700">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-[14px] font-semibold text-danger">
          {error}
        </span>
      )}
    </label>
  )
}

function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  )
}

export function FullScreenSpinner() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <Spinner className="h-10 w-10 text-primary" />
    </div>
  )
}

export function Th({
  children,
  className = '',
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b border-line bg-slate-100 px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wide text-slate-600 ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className = '',
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`border-b border-line px-4 py-3 text-[15px] ${className}`}
      {...props}
    >
      {children}
    </td>
  )
}
