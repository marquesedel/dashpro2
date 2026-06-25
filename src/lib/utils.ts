import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ProjectStatus, ActionStatus, RiskProbability, RiskImpact, RiskStatus, ReportType, ExpenseCategory, ExpenseStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ —'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatRelativeDate(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 7) return `${days} dias atrás`
  return formatDate(date)
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  atrasado: 'Atrasado',
  em_risco: 'Em Risco',
  nao_iniciado: 'Não Iniciado',
}

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  em_andamento: 'text-accent bg-accent/10',
  concluido: 'text-success bg-success/10',
  atrasado: 'text-danger bg-danger/10',
  em_risco: 'text-warning bg-warning/10',
  nao_iniciado: 'text-muted bg-muted/10',
}

export const PROJECT_STATUS_ROW_STYLE: Record<ProjectStatus, { border: string; hover: string; progress: string }> = {
  em_andamento: { border: 'border-l-accent', hover: 'hover:bg-accent/5', progress: 'bg-accent' },
  atrasado: { border: 'border-l-danger', hover: 'hover:bg-danger/5', progress: 'bg-danger' },
  concluido: { border: 'border-l-success', hover: 'hover:bg-success/5', progress: 'bg-success' },
  em_risco: { border: 'border-l-warning', hover: 'hover:bg-warning/5', progress: 'bg-warning' },
  nao_iniciado: { border: 'border-l-muted', hover: 'hover:bg-muted/5', progress: 'bg-muted' },
}

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  bloqueada: 'Bloqueada',
}

export const ACTION_STATUS_COLOR: Record<ActionStatus, string> = {
  pendente: 'text-warning bg-warning/10',
  em_andamento: 'text-accent bg-accent/10',
  concluida: 'text-success bg-success/10',
  bloqueada: 'text-danger bg-danger/10',
}

export const RISK_PROBABILITY_LABEL: Record<RiskProbability, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

export const RISK_IMPACT_LABEL: Record<RiskImpact, string> = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
}

export const RISK_STATUS_LABEL: Record<RiskStatus, string> = {
  aberto: 'Aberto',
  mitigado: 'Mitigado',
  materializado: 'Materializado',
}

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  executivo: 'Executivo',
  risco: 'Risco',
}

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  pessoal: 'Pessoal',
  equipamentos: 'Equipamentos',
  materiais: 'Materiais',
  servicos: 'Serviços',
  viagens: 'Viagens',
  outros: 'Outros',
}

export const EXPENSE_STATUS_LABEL: Record<ExpenseStatus, string> = {
  previsto: 'Previsto',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
}

export const EXPENSE_STATUS_COLOR: Record<ExpenseStatus, string> = {
  previsto: 'text-warning bg-warning/10',
  realizado: 'text-success bg-success/10',
  cancelado: 'text-muted bg-muted/10',
}
