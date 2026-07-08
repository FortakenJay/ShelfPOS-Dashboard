export function ChartLoading({
  fill = false,
}: {
  fill?: boolean
}): React.JSX.Element {
  return (
    <div
      className={`${fill ? 'h-full min-h-0' : 'h-56'} animate-pulse rounded-lg bg-slate-100`}
      aria-hidden
    />
  )
}
