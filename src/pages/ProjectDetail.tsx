import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Check, Trash2, AlertTriangle, FileText, Eye, Receipt, ListChecks, type LucideIcon } from 'lucide-react'
import {
  useProject, useActions, useCreateAction, useUpdateAction, useDeleteAction,
  useRisks, useCreateRisk, useUpdateRisk, useDeleteRisk, useProfiles,
} from '@/hooks/useProjects'
import { useReports } from '@/hooks/useReports'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectStatusBadge, ActionStatusBadge, ExpenseStatusBadge } from '@/components/projects/StatusBadge'
import { ReportViewer } from '@/components/report/ReportViewer'
import {
  formatDate, formatCurrency, RISK_PROBABILITY_LABEL, RISK_IMPACT_LABEL,
  RISK_STATUS_LABEL, REPORT_TYPE_LABEL, ACTION_STATUS_LABEL,
  EXPENSE_CATEGORY_LABEL, EXPENSE_STATUS_LABEL, cn,
} from '@/lib/utils'
import type {
  Action, ActionStatus, Risk, RiskProbability, RiskImpact, RiskStatus,
  ReportType, Report, Expense, ExpenseCategory, ExpenseStatus,
} from '@/types'

type Tab = 'acoes' | 'riscos' | 'gastos' | 'relatorios'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('acoes')

  const { data: project, isLoading } = useProject(id!)
  const { data: actions } = useActions(id!)
  const { data: risks } = useRisks(id!)
  const { data: expenses } = useExpenses(id!)
  const { data: reports } = useReports(id!)
  const { data: profiles } = useProfiles()

  const createAction = useCreateAction()
  const updateAction = useUpdateAction()
  const deleteAction = useDeleteAction()
  const createRisk = useCreateRisk()
  const updateRisk = useUpdateRisk()
  const deleteRisk = useDeleteRisk()
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const [showActionModal, setShowActionModal] = useState(false)
  const [editingAction, setEditingAction] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)
  const [actionForm, setActionForm] = useState({ title: '', description: '', status: 'pendente' as ActionStatus, due_date: '', user_id: '' })

  const [showRiskModal, setShowRiskModal] = useState(false)
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null)
  const [riskForm, setRiskForm] = useState({ title: '', description: '', probability: 'media' as RiskProbability, impact: 'medio' as RiskImpact, status: 'aberto' as RiskStatus })

  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: 'outros' as ExpenseCategory,
    planned_amount: '',
    actual_amount: '',
    expense_date: '',
    status: 'previsto' as ExpenseStatus,
  })

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAction) {
        await updateAction.mutateAsync({ id: editingAction, project_id: id!, ...actionForm, user_id: actionForm.user_id || null })
        toast('Ação atualizada', 'success')
      } else {
        await createAction.mutateAsync({ project_id: id!, ...actionForm, user_id: actionForm.user_id || profile?.id || null })
        toast('Ação criada', 'success')
      }
      setShowActionModal(false)
      setEditingAction(null)
      setActionForm({ title: '', description: '', status: 'pendente', due_date: '', user_id: '' })
    } catch {
      toast('Erro ao salvar ação', 'error')
    }
  }

  const handleMarkDone = async (actionId: string, projectId: string) => {
    try {
      await updateAction.mutateAsync({ id: actionId, project_id: projectId, status: 'concluida' })
      toast('Ação concluída!', 'success')
    } catch {
      toast('Erro ao atualizar', 'error')
    }
  }

  const handleDeleteAction = async (actionId: string, projectId: string) => {
    if (!confirm('Remover esta ação?')) return
    try {
      await deleteAction.mutateAsync({ id: actionId, project_id: projectId })
      setSelectedAction(null)
      toast('Ação removida', 'success')
    } catch {
      toast('Erro ao remover', 'error')
    }
  }

  const handleDeleteRisk = async (riskId: string, projectId: string) => {
    if (!confirm('Remover este risco?')) return
    try {
      await deleteRisk.mutateAsync({ id: riskId, project_id: projectId })
      setSelectedRisk(null)
      toast('Risco removido', 'success')
    } catch {
      toast('Erro ao remover', 'error')
    }
  }

  const handleMitigateRisk = async (risk: Risk) => {
    try {
      await updateRisk.mutateAsync({ id: risk.id, project_id: risk.project_id, status: 'mitigado' })
      setSelectedRisk(prev => prev?.id === risk.id ? { ...prev, status: 'mitigado' } : prev)
      toast('Risco mitigado', 'success')
    } catch {
      toast('Erro ao mitigar', 'error')
    }
  }

  const handleSaveRisk = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRisk.mutateAsync({ project_id: id!, ...riskForm, description: riskForm.description || null })
      toast('Risco cadastrado', 'success')
      setShowRiskModal(false)
      setRiskForm({ title: '', description: '', probability: 'media', impact: 'medio', status: 'aberto' })
    } catch {
      toast('Erro ao salvar risco', 'error')
    }
  }

  const openEditExpense = (expense: Expense) => {
    setExpenseForm({
      description: expense.description,
      category: expense.category,
      planned_amount: String(expense.planned_amount),
      actual_amount: String(expense.actual_amount),
      expense_date: expense.expense_date ?? '',
      status: expense.status,
    })
    setEditingExpense(expense.id)
    setShowExpenseModal(true)
  }

  const resetExpenseForm = () => {
    setExpenseForm({
      description: '',
      category: 'outros',
      planned_amount: '',
      actual_amount: '',
      expense_date: '',
      status: 'previsto',
    })
    setEditingExpense(null)
  }

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      description: expenseForm.description,
      category: expenseForm.category,
      planned_amount: Number(expenseForm.planned_amount) || 0,
      actual_amount: Number(expenseForm.actual_amount) || 0,
      expense_date: expenseForm.expense_date || null,
      status: expenseForm.status,
    }
    try {
      if (editingExpense) {
        await updateExpense.mutateAsync({ id: editingExpense, project_id: id!, ...payload })
        toast('Gasto atualizado', 'success')
      } else {
        await createExpense.mutateAsync({ project_id: id!, ...payload })
        toast('Gasto cadastrado', 'success')
      }
      setShowExpenseModal(false)
      resetExpenseForm()
    } catch {
      toast('Erro ao salvar gasto', 'error')
    }
  }

  const handleDeleteExpense = async (expenseId: string, projectId: string) => {
    if (!confirm('Remover este lançamento?')) return
    try {
      await deleteExpense.mutateAsync({ id: expenseId, project_id: projectId })
      toast('Gasto removido', 'success')
    } catch {
      toast('Erro ao remover', 'error')
    }
  }

  const openEditAction = (action: Action) => {
    setActionForm({
      title: action.title,
      description: action.description ?? '',
      status: action.status,
      due_date: action.due_date ?? '',
      user_id: action.user_id ?? '',
    })
    setEditingAction(action.id)
    setShowActionModal(true)
    setSelectedAction(null)
  }

  if (isLoading || !project) {
    return (
      <div className="p-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-black/5 animate-pulse" />
        ))}
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: LucideIcon; count?: number }[] = [
    { id: 'acoes', label: 'Ações', icon: ListChecks, count: actions?.length },
    { id: 'riscos', label: 'Riscos', icon: AlertTriangle, count: risks?.length },
    { id: 'gastos', label: 'Gastos', icon: Receipt, count: expenses?.length },
    { id: 'relatorios', label: 'Relatórios', icon: FileText, count: reports?.length },
  ]

  const analysts = profiles?.filter(p => p.role === 'analista') ?? []

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={project.description ?? undefined}
        actions={
          <Link to="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
        }
      />

      <div className="p-8 space-y-6">
        {/* Project header card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-xs text-muted mb-1">Status</p>
            <ProjectStatusBadge status={project.status} />
          </Card>
          <Card>
            <p className="text-xs text-muted mb-1">Progresso</p>
            <p className="text-2xl font-bold text-foreground mb-2">{project.progress}%</p>
            <ProgressBar value={project.progress} />
          </Card>
          <Card>
            <p className="text-xs text-muted mb-1">Prazo</p>
            <p className="text-sm font-medium text-foreground">{formatDate(project.start_date)} — {formatDate(project.end_date)}</p>
          </Card>
          <Card>
            <p className="text-xs text-muted mb-1">Orçamento</p>
            <p className="text-sm font-medium text-foreground">{formatCurrency(project.budget)}</p>
            <p className="text-xs text-muted mt-0.5">Gasto: {formatCurrency(project.spent)}</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-border flex gap-4">
          {tabs.map(t => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-3 text-base font-medium transition-colors border-b-2 -mb-px',
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {t.label}
                {t.count !== undefined && (
                  <span className={cn(
                    'ml-0.5 text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center',
                    isActive ? 'bg-accent/10 text-accent' : 'bg-black/5 text-muted',
                  )}>
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Ações Tab */}
        {tab === 'acoes' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => { setEditingAction(null); setActionForm({ title: '', description: '', status: 'pendente', due_date: '', user_id: '' }); setShowActionModal(true) }}>
                <Plus className="h-3.5 w-3.5" /> Nova Ação
              </Button>
            </div>
            {actions && actions.length > 0 ? (
              <div className="space-y-2">
                {actions.map(action => (
                  <div
                    key={action.id}
                    onClick={() => setSelectedAction(action)}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:border-accent/40 hover:bg-accent/5 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${action.status === 'concluida' ? 'text-muted line-through' : 'text-foreground'}`}>
                        {action.title}
                      </p>
                      {action.description && <p className="text-xs text-muted mt-0.5 line-clamp-1">{action.description}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        {action.due_date && <span className="text-xs text-muted">Prazo: {formatDate(action.due_date)}</span>}
                        {action.user && <span className="text-xs text-muted">{(action.user as { full_name?: string }).full_name}</span>}
                      </div>
                    </div>
                    <ActionStatusBadge status={action.status} />
                    <div className="flex items-center gap-1">
                      {action.status !== 'concluida' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkDone(action.id, action.project_id) }}
                          className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                          title="Concluir"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditAction(action) }}
                        className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteAction(action.id, action.project_id) }}
                        className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted text-center py-12">Nenhuma ação cadastrada</p>
            )}
          </div>
        )}

        {/* Riscos Tab */}
        {tab === 'riscos' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowRiskModal(true)}>
                <Plus className="h-3.5 w-3.5" /> Novo Risco
              </Button>
            </div>
            {risks && risks.length > 0 ? (
              <div className="space-y-2">
                {risks.map(risk => (
                  <div
                    key={risk.id}
                    onClick={() => setSelectedRisk(risk)}
                    className="rounded-lg border border-border bg-card px-4 py-3 hover:border-warning/40 hover:bg-warning/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{risk.title}</p>
                          {risk.description && <p className="text-xs text-muted mt-0.5 line-clamp-1">{risk.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className="text-warning bg-warning/10">P: {RISK_PROBABILITY_LABEL[risk.probability]}</Badge>
                        <Badge className="text-danger bg-danger/10">I: {RISK_IMPACT_LABEL[risk.impact]}</Badge>
                        <Badge className={risk.status === 'aberto' ? 'text-danger bg-danger/10' : risk.status === 'mitigado' ? 'text-success bg-success/10' : 'text-muted bg-muted/10'}>
                          {RISK_STATUS_LABEL[risk.status]}
                        </Badge>
                        {risk.status === 'aberto' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMitigateRisk(risk) }}
                            className="text-xs text-accent hover:underline"
                          >
                            Mitigar
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteRisk(risk.id, risk.project_id) }}
                          className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted text-center py-12">Nenhum risco cadastrado</p>
            )}
          </div>
        )}

        {/* Gastos Tab */}
        {tab === 'gastos' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted">
                Total realizado: <span className="font-medium text-foreground">{formatCurrency(project.spent)}</span>
              </p>
              <Button size="sm" onClick={() => { resetExpenseForm(); setShowExpenseModal(true) }}>
                <Plus className="h-3.5 w-3.5" /> Novo Gasto
              </Button>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-black/[0.03] border-b border-border">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs text-muted font-medium">Descrição</th>
                    <th className="text-left px-4 py-3 text-xs text-muted font-medium">Categoria</th>
                    <th className="text-left px-4 py-3 text-xs text-muted font-medium">Valor Previsto</th>
                    <th className="text-left px-4 py-3 text-xs text-muted font-medium">Valor Realizado</th>
                    <th className="text-left px-4 py-3 text-xs text-muted font-medium">Data</th>
                    <th className="text-left px-4 py-3 text-xs text-muted font-medium">Status</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {expenses && expenses.length > 0 ? (
                    expenses.map(expense => (
                      <tr key={expense.id} className="border-b border-border/50 hover:bg-black/5 transition-colors">
                        <td className="px-5 py-4 font-medium text-foreground">{expense.description}</td>
                        <td className="px-4 py-4 text-muted">{EXPENSE_CATEGORY_LABEL[expense.category]}</td>
                        <td className="px-4 py-4 text-muted whitespace-nowrap">{formatCurrency(expense.planned_amount)}</td>
                        <td className="px-4 py-4 text-foreground whitespace-nowrap">{formatCurrency(expense.actual_amount)}</td>
                        <td className="px-4 py-4 text-muted whitespace-nowrap">{formatDate(expense.expense_date)}</td>
                        <td className="px-4 py-4">
                          <ExpenseStatusBadge status={expense.status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditExpense(expense)}
                              className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id, expense.project_id)}
                              className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-muted">
                        <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        Nenhum gasto cadastrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Relatórios Tab */}
        {tab === 'relatorios' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Link to={`/projects/${id}/report`}>
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" /> Gerar Relatório
                </Button>
              </Link>
            </div>
            {reports && reports.length > 0 ? (
              <div className="space-y-2">
                {reports.map(report => (
                  <div
                    key={report.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:border-accent/40 hover:bg-accent/5 transition-colors cursor-pointer group"
                    onClick={() => setSelectedReport(report)}
                  >
                    <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Relatório {REPORT_TYPE_LABEL[report.type as ReportType]}</p>
                      <p className="text-xs text-muted">
                        {new Date(report.created_at).toLocaleString('pt-BR')}
                        {report.generator && (
                          <span className="ml-2">· por {(report.generator as { full_name?: string }).full_name ?? '—'}</span>
                        )}
                      </p>
                    </div>
                    <Badge className="text-accent bg-accent/10 capitalize">{REPORT_TYPE_LABEL[report.type as ReportType]}</Badge>
                    <Eye className="h-4 w-4 text-muted group-hover:text-accent transition-colors flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted text-center py-12">Nenhum relatório gerado ainda</p>
            )}
          </div>
        )}
      </div>

      {/* Action Detail Modal */}
      <Modal open={!!selectedAction} onClose={() => setSelectedAction(null)} title="Detalhes da Ação">
        {selectedAction && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted mb-1">Título</p>
              <p className={cn('text-sm font-medium', selectedAction.status === 'concluida' && 'text-muted line-through')}>
                {selectedAction.title}
              </p>
            </div>
            {selectedAction.description && (
              <div>
                <p className="text-xs text-muted mb-1">Descrição</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedAction.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted mb-1">Status</p>
                <ActionStatusBadge status={selectedAction.status} />
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Prazo</p>
                <p className="text-sm text-foreground">{formatDate(selectedAction.due_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Responsável</p>
                <p className="text-sm text-foreground">
                  {(selectedAction.user as { full_name?: string } | undefined)?.full_name ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Criada em</p>
                <p className="text-sm text-foreground">{formatDate(selectedAction.created_at)}</p>
              </div>
              {selectedAction.completed_at && (
                <div>
                  <p className="text-xs text-muted mb-1">Concluída em</p>
                  <p className="text-sm text-foreground">{formatDate(selectedAction.completed_at)}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              {selectedAction.status !== 'concluida' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-success/10 text-success hover:bg-success/20"
                  onClick={() => { handleMarkDone(selectedAction.id, selectedAction.project_id); setSelectedAction(null) }}
                >
                  <Check className="h-3.5 w-3.5" /> Concluir
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="bg-accent/10 text-accent hover:bg-accent/20"
                onClick={() => openEditAction(selectedAction)}
              >
                <Edit2 className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="bg-danger/10 text-danger hover:bg-danger/20"
                onClick={() => handleDeleteAction(selectedAction.id, selectedAction.project_id)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal open={showActionModal} onClose={() => setShowActionModal(false)} title={editingAction ? 'Editar Ação' : 'Nova Ação'}>
        <form onSubmit={handleSaveAction} className="space-y-4">
          <Input label="Título" value={actionForm.title} onChange={e => setActionForm(f => ({ ...f, title: e.target.value }))} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground/70">Descrição</label>
            <textarea
              value={actionForm.description}
              onChange={e => setActionForm(f => ({ ...f, description: e.target.value }))}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={Object.entries(ACTION_STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))}
              value={actionForm.status}
              onChange={e => setActionForm(f => ({ ...f, status: e.target.value as ActionStatus }))}
            />
            <Input label="Prazo" type="date" value={actionForm.due_date} onChange={e => setActionForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <Select
            label="Responsável"
            options={[{ value: '', label: 'Sem responsável' }, ...analysts.map(a => ({ value: a.id, label: a.full_name ?? a.id }))]}
            value={actionForm.user_id}
            onChange={e => setActionForm(f => ({ ...f, user_id: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowActionModal(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={createAction.isPending || updateAction.isPending} className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Report Viewer */}
      {selectedReport && selectedReport.content && (
        <ReportViewer
          project={project}
          actions={actions ?? []}
          risks={risks ?? []}
          reportType={selectedReport.type}
          content={selectedReport.content}
          generatedAt={new Date(selectedReport.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Risk Detail Modal */}
      <Modal open={!!selectedRisk} onClose={() => setSelectedRisk(null)} title="Detalhes do Risco">
        {selectedRisk && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted mb-1">Título</p>
              <p className="text-sm font-medium text-foreground">{selectedRisk.title}</p>
            </div>
            {selectedRisk.description && (
              <div>
                <p className="text-xs text-muted mb-1">Descrição</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedRisk.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted mb-1">Probabilidade</p>
                <Badge className="text-warning bg-warning/10">{RISK_PROBABILITY_LABEL[selectedRisk.probability]}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Impacto</p>
                <Badge className="text-danger bg-danger/10">{RISK_IMPACT_LABEL[selectedRisk.impact]}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Status</p>
                <Badge className={selectedRisk.status === 'aberto' ? 'text-danger bg-danger/10' : selectedRisk.status === 'mitigado' ? 'text-success bg-success/10' : 'text-muted bg-muted/10'}>
                  {RISK_STATUS_LABEL[selectedRisk.status]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Cadastrado em</p>
                <p className="text-sm text-foreground">{formatDate(selectedRisk.created_at)}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {selectedRisk.status === 'aberto' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-accent/10 text-accent hover:bg-accent/20"
                  onClick={() => handleMitigateRisk(selectedRisk)}
                >
                  Mitigar
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="bg-danger/10 text-danger hover:bg-danger/20"
                onClick={() => handleDeleteRisk(selectedRisk.id, selectedRisk.project_id)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Risk Modal */}
      <Modal open={showRiskModal} onClose={() => setShowRiskModal(false)} title="Novo Risco">
        <form onSubmit={handleSaveRisk} className="space-y-4">
          <Input label="Título" value={riskForm.title} onChange={e => setRiskForm(f => ({ ...f, title: e.target.value }))} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground/70">Descrição</label>
            <textarea
              value={riskForm.description}
              onChange={e => setRiskForm(f => ({ ...f, description: e.target.value }))}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Probabilidade"
              options={Object.entries(RISK_PROBABILITY_LABEL).map(([v, l]) => ({ value: v, label: l }))}
              value={riskForm.probability}
              onChange={e => setRiskForm(f => ({ ...f, probability: e.target.value as RiskProbability }))}
            />
            <Select
              label="Impacto"
              options={Object.entries(RISK_IMPACT_LABEL).map(([v, l]) => ({ value: v, label: l }))}
              value={riskForm.impact}
              onChange={e => setRiskForm(f => ({ ...f, impact: e.target.value as RiskImpact }))}
            />
            <Select
              label="Status"
              options={Object.entries(RISK_STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))}
              value={riskForm.status}
              onChange={e => setRiskForm(f => ({ ...f, status: e.target.value as RiskStatus }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowRiskModal(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={createRisk.isPending} className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal
        open={showExpenseModal}
        onClose={() => { setShowExpenseModal(false); resetExpenseForm() }}
        title={editingExpense ? 'Editar Gasto' : 'Novo Gasto'}
        className="max-w-xl"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <Input
            label="Descrição"
            value={expenseForm.description}
            onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Categoria"
              options={Object.entries(EXPENSE_CATEGORY_LABEL).map(([v, l]) => ({ value: v, label: l }))}
              value={expenseForm.category}
              onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
            />
            <Select
              label="Status"
              options={Object.entries(EXPENSE_STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))}
              value={expenseForm.status}
              onChange={e => setExpenseForm(f => ({ ...f, status: e.target.value as ExpenseStatus }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor Previsto (R$)"
              type="number"
              min="0"
              step="0.01"
              value={expenseForm.planned_amount}
              onChange={e => setExpenseForm(f => ({ ...f, planned_amount: e.target.value }))}
            />
            <Input
              label="Valor Realizado (R$)"
              type="number"
              min="0"
              step="0.01"
              value={expenseForm.actual_amount}
              onChange={e => setExpenseForm(f => ({ ...f, actual_amount: e.target.value }))}
            />
          </div>
          <Input
            label="Data"
            type="date"
            value={expenseForm.expense_date}
            onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowExpenseModal(false); resetExpenseForm() }} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={createExpense.isPending || updateExpense.isPending} className="flex-1">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
