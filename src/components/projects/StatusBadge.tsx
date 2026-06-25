import { Badge } from '@/components/ui/Badge'
import {
  PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR,
  ACTION_STATUS_LABEL, ACTION_STATUS_COLOR,
  EXPENSE_STATUS_LABEL, EXPENSE_STATUS_COLOR,
} from '@/lib/utils'
import type { ProjectStatus, ActionStatus, ExpenseStatus } from '@/types'

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge className={PROJECT_STATUS_COLOR[status]}>
      {PROJECT_STATUS_LABEL[status]}
    </Badge>
  )
}

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  return (
    <Badge className={ACTION_STATUS_COLOR[status]}>
      {ACTION_STATUS_LABEL[status]}
    </Badge>
  )
}

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <Badge className={EXPENSE_STATUS_COLOR[status]}>
      {EXPENSE_STATUS_LABEL[status]}
    </Badge>
  )
}
