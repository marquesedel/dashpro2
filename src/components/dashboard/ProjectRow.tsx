import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR, formatDate } from '@/lib/utils'
import type { Project } from '@/types'

export function ProjectRow({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="flex items-center gap-4 rounded-lg px-4 py-3 hover:bg-black/5 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
        <p className="text-xs text-muted mt-0.5">
          Prazo: {formatDate(project.end_date)}
        </p>
      </div>
      <ProgressBar value={project.progress} showLabel className="w-32" />
      <Badge className={PROJECT_STATUS_COLOR[project.status]}>
        {PROJECT_STATUS_LABEL[project.status]}
      </Badge>
      <ArrowRight className="h-4 w-4 text-muted group-hover:text-foreground transition-colors" />
    </Link>
  )
}
