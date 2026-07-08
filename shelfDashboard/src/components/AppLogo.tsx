const LOGO_SRC = '/appSHELFPOS.png'

export function AppLogo({
  className = '',
  imgClassName = '',
  size = 'md',
  showWordmark = true,
  wordmarkVariant = 'light',
}: {
  className?: string
  imgClassName?: string
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  wordmarkVariant?: 'light' | 'dark'
}) {
  const height =
    size === 'lg' ? 'h-16' : size === 'sm' ? 'h-8' : 'h-10'
  const textSize =
    size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-xl'
  const shelfClass =
    wordmarkVariant === 'dark' ? 'text-slate-900' : 'text-white'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={LOGO_SRC}
        alt=""
        className={`${height} w-auto max-w-full shrink-0 object-contain ${imgClassName}`}
      />
      {showWordmark && (
        <span className={`font-extrabold tracking-tight ${textSize}`} aria-label="ShelfPOS">
          <span className={shelfClass}>Shelf</span>
          <span className="text-slate-400">POS</span>
        </span>
      )}
    </div>
  )
}
