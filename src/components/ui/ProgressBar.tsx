import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  className?: string
  showLabel?: boolean
  barClassName?: string
}

export function ProgressBar({ value, className, showLabel, barClassName }: ProgressBarProps) {
  const color = barClassName ?? (value >= 75 ? 'bg-success' : value >= 40 ? 'bg-accent' : 'bg-warning')

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-muted w-8 text-right">{value}%</span>}
    </div>
  )
}
