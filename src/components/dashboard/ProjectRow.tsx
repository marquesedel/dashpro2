import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/IconButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn, PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR, PROJECT_STATUS_ROW_STYLE, formatDate } from '@/lib/utils'
import type { Project } from '@/types'

export function ProjectRow({ project }: { project: Project }) {
  const rowStyle = PROJECT_STATUS_ROW_STYLE[project.status]

  return (
    <Link
      to={`/projects/${project.id}`}
      className={cn(
        'flex items-center gap-4 rounded-lg border-l-4 px-4 py-3 transition-colors group',
        rowStyle.border,
        rowStyle.hover,
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
        <p className="text-xs text-muted mt-0.5">
          Prazo: {formatDate(project.end_date)}
        </p>
      </div>
      <ProgressBar value={project.progress} showLabel className="w-32" barClassName={rowStyle.progress} />
      <Badge className={PROJECT_STATUS_COLOR[project.status]}>
        {PROJECT_STATUS_LABEL[project.status]}
      </Badge>
      <IconButton tone="accent" size="sm" tabIndex={-1} aria-hidden>
        <ArrowRight className="h-3.5 w-3.5" />
      </IconButton>
    </Link>
  )
}
