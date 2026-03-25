import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color?: string
  loading?: boolean
}

export function StatCard({ label, value, icon, color = 'text-accent', loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-9 w-16" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:border-border transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <div className={cn('h-8 w-8 flex items-center justify-center rounded-lg bg-black/5', color)}>
          {icon}
        </div>
      </div>
      <p className={cn('text-3xl font-bold', color)}>{value}</p>
    </div>
  )
}
