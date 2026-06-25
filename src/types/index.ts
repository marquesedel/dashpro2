export type UserRole = 'analista' | 'gerente'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  manager_id: string | null
  created_at: string
}

export type ProjectStatus = 'em_andamento' | 'concluido' | 'atrasado' | 'em_risco' | 'nao_iniciado'

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  budget: number | null
  spent: number
  owner_id: string | null
  manager_id: string | null
  progress: number
  created_at: string
  updated_at: string
  owner?: Profile
  manager?: Profile
}

export type ActionStatus = 'pendente' | 'em_andamento' | 'concluida' | 'bloqueada'

export interface Action {
  id: string
  project_id: string
  user_id: string | null
  title: string
  description: string | null
  status: ActionStatus
  due_date: string | null
  completed_at: string | null
  created_at: string
  user?: Profile
}

export type ReportType = 'semanal' | 'mensal' | 'executivo' | 'risco'

export interface Report {
  id: string
  project_id: string
  generated_by: string | null
  content: string | null
  type: ReportType
  created_at: string
  generator?: Profile
}

export type RiskProbability = 'baixa' | 'media' | 'alta'
export type RiskImpact = 'baixo' | 'medio' | 'alto'
export type RiskStatus = 'aberto' | 'mitigado' | 'materializado'

export interface Risk {
  id: string
  project_id: string
  title: string
  description: string | null
  probability: RiskProbability
  impact: RiskImpact
  status: RiskStatus
  created_at: string
}

export type ExpenseCategory = 'pessoal' | 'equipamentos' | 'materiais' | 'servicos' | 'viagens' | 'outros'
export type ExpenseStatus = 'previsto' | 'realizado' | 'cancelado'

export interface Expense {
  id: string
  project_id: string
  description: string
  category: ExpenseCategory
  planned_amount: number
  actual_amount: number
  expense_date: string | null
  status: ExpenseStatus
  created_at: string
}
