import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Check, Trash2, AlertTriangle, FileText, Eye } from 'lucide-react'
import {
  useProject, useActions, useCreateAction, useUpdateAction, useDeleteAction,
  useRisks, useCreateRisk, useUpdateRisk, useProfiles,
} from '@/hooks/useProjects'
import { useReports } from '@/hooks/useReports'
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
import { ProjectStatusBadge, ActionStatusBadge } from '@/components/projects/StatusBadge'
import { ReportViewer } from '@/components/report/ReportViewer'
import {
  formatDate, formatCurrency, RISK_PROBABILITY_LABEL, RISK_IMPACT_LABEL,
  RISK_STATUS_LABEL, REPORT_TYPE_LABEL, ACTION_STATUS_LABEL,
} from '@/lib/utils'
import type { ActionStatus, RiskProbability, RiskImpact, RiskStatus, ReportType, Report } from '@/types'

type Tab = 'acoes' | 'riscos' | 'relatorios'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('acoes')

  const { data: project, isLoading } = useProject(id!)
  const { data: actions } = useActions(id!)
  const { data: risks } = useRisks(id!)
  const { data: reports } = useReports(id!)
  const { data: profiles } = useProfiles()

  const createAction = useCreateAction()
  const updateAction = useUpdateAction()
  const deleteAction = useDeleteAction()
  const createRisk = useCreateRisk()
  const updateRisk = useUpdateRisk()

  const [showActionModal, setShowActionModal] = useState(false)
  const [editingAction, setEditingAction] = useState<string | null>(null)
  const [actionForm, setActionForm] = useState({ title: '', description: '', status: 'pendente' as ActionStatus, due_date: '', user_id: '' })

  const [showRiskModal, setShowRiskModal] = useState(false)
  const [riskForm, setRiskForm] = useState({ title: '', description: '', probability: 'media' as RiskProbability, impact: 'medio' as RiskImpact, status: 'aberto' as RiskStatus })

  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

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
      toast('Ação removida', 'success')
    } catch {
      toast('Erro ao remover', 'error')
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

  const openEditAction = (action: ReturnType<typeof useActions>['data'] extends (infer U)[] | undefined ? U : never) => {
    if (!action) return
    setActionForm({
      title: action.title,
      description: action.description ?? '',
      status: action.status,
      due_date: action.due_date ?? '',
      user_id: action.user_id ?? '',
    })
    setEditingAction(action.id)
    setShowActionModal(true)
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

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'acoes', label: 'Ações', count: actions?.length },
    { id: 'riscos', label: 'Riscos', count: risks?.length },
    { id: 'relatorios', label: 'Relatórios', count: reports?.length },
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
        <div className="border-b border-border flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1.5 text-xs bg-black/5 rounded-full px-1.5 py-0.5">{t.count}</span>
              )}
            </button>
          ))}
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
                  <div key={action.id} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:border-border transition-colors">
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
                        <button onClick={() => handleMarkDone(action.id, action.project_id)} className="p-1.5 text-muted hover:text-success transition-colors" title="Concluir">
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => openEditAction(action)} className="p-1.5 text-muted hover:text-foreground transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteAction(action.id, action.project_id)} className="p-1.5 text-muted hover:text-danger transition-colors">
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
                  <div key={risk.id} className="rounded-lg border border-border bg-card px-4 py-3 hover:border-border transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{risk.title}</p>
                          {risk.description && <p className="text-xs text-muted mt-0.5">{risk.description}</p>}
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
                            onClick={() => updateRisk.mutateAsync({ id: risk.id, project_id: risk.project_id, status: 'mitigado' })}
                            className="text-xs text-accent hover:underline"
                          >
                            Mitigar
                          </button>
                        )}
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
    </div>
  )
}
