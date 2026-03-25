import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ArrowRight } from 'lucide-react'
import { useProjects, useProfiles, useCreateProject } from '@/hooks/useProjects'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR, formatDate, formatCurrency } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'em_risco', label: 'Em Risco' },
  { value: 'nao_iniciado', label: 'Não Iniciado' },
]

export default function Projects() {
  const { profile } = useAuth()
  const { data: projects, isLoading } = useProjects()
  const { data: profiles } = useProfiles()
  const createProject = useCreateProject()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [analystFilter, setAnalystFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const [form, setForm] = useState({
    name: '', description: '', status: 'nao_iniciado' as ProjectStatus,
    start_date: '', end_date: '', budget: '', owner_id: '', manager_id: profile?.id ?? '',
  })

  const analysts = profiles?.filter(p => p.role === 'analista') ?? []
  const analystOptions = [
    { value: '', label: 'Todos os analistas' },
    ...analysts.map(a => ({ value: a.id, label: a.full_name ?? a.id })),
  ]

  const filtered = projects?.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && p.status !== statusFilter) return false
    if (analystFilter && p.owner_id !== analystFilter) return false
    return true
  }) ?? []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProject.mutateAsync({
        name: form.name,
        description: form.description || null,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? Number(form.budget) : null,
        owner_id: form.owner_id || (profile?.role === 'analista' ? profile.id : null),
        manager_id: profile?.role === 'gerente' ? profile.id : profile?.manager_id ?? null,
      })
      toast('Projeto criado com sucesso!', 'success')
      setShowCreate(false)
      setForm({ name: '', description: '', status: 'nao_iniciado', start_date: '', end_date: '', budget: '', owner_id: '', manager_id: profile?.id ?? '' })
    } catch {
      toast('Erro ao criar projeto', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Projetos"
        subtitle={`${filtered.length} projeto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Novo Projeto
          </Button>
        }
      />

      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              placeholder="Buscar projetos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-44"
          />
          {profile?.role === 'gerente' && (
            <Select
              options={analystOptions}
              value={analystFilter}
              onChange={e => setAnalystFilter(e.target.value)}
              className="w-44"
            />
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 text-xs text-muted font-medium">Projeto</th>
                <th className="text-left px-4 py-3 text-xs text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-muted font-medium">Progresso</th>
                <th className="text-left px-4 py-3 text-xs text-muted font-medium">Prazo</th>
                <th className="text-left px-4 py-3 text-xs text-muted font-medium">Orçamento</th>
                {profile?.role === 'gerente' && (
                  <th className="text-left px-4 py-3 text-xs text-muted font-medium">Analista</th>
                )}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 rounded bg-black/5 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map(project => (
                  <tr key={project.id} className="border-b border-border/50 hover:bg-black/5 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-muted mt-0.5 line-clamp-1">{project.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={PROJECT_STATUS_COLOR[project.status]}>
                        {PROJECT_STATUS_LABEL[project.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 w-36">
                      <ProgressBar value={project.progress} showLabel />
                    </td>
                    <td className="px-4 py-4 text-muted whitespace-nowrap">{formatDate(project.end_date)}</td>
                    <td className="px-4 py-4 text-muted whitespace-nowrap">{formatCurrency(project.budget)}</td>
                    {profile?.role === 'gerente' && (
                      <td className="px-4 py-4 text-muted">
                        {(project.owner as { full_name?: string } | undefined)?.full_name ?? '—'}
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <Link to={`/projects/${project.id}`} className="text-muted hover:text-foreground transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    Nenhum projeto encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Projeto" className="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nome do projeto" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground/70">Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={statusOptions.slice(1)}
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}
            />
            {profile?.role === 'gerente' && analysts.length > 0 && (
              <Select
                label="Analista Responsável"
                options={[{ value: '', label: 'Selecionar...' }, ...analysts.map(a => ({ value: a.id, label: a.full_name ?? a.id }))]}
                value={form.owner_id}
                onChange={e => setForm(f => ({ ...f, owner_id: e.target.value }))}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data de Início" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            <Input label="Data de Entrega" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
          <Input label="Orçamento (R$)" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={createProject.isPending} className="flex-1">Criar Projeto</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
