import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Clock, CheckCircle, AlertTriangle, TrendingUp, Users, AlertCircle, Plus } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { useAuth } from '@/hooks/useAuth'
import { useProjects, useProfiles, useCreateProject } from '@/hooks/useProjects'
import { useToast } from '@/components/ui/Toast'
import { StatCard } from '@/components/dashboard/StatCard'
import { ProjectRow } from '@/components/dashboard/ProjectRow'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/layout/PageHeader'
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

const STATUS_COLORS: Record<ProjectStatus, string> = {
  em_andamento: '#6366f1',
  concluido: '#22c55e',
  atrasado: '#ef4444',
  em_risco: '#f59e0b',
  nao_iniciado: '#888888',
}

const statusOptions = [
  { value: 'nao_iniciado', label: 'Não Iniciado' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'em_risco', label: 'Em Risco' },
  { value: 'concluido', label: 'Concluído' },
]

export default function Dashboard() {
  const { profile } = useAuth()
  const { data: projects, isLoading } = useProjects()
  const { data: profiles } = useProfiles()
  const createProject = useCreateProject()
  const { toast } = useToast()

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', status: 'nao_iniciado' as ProjectStatus,
    start_date: '', end_date: '', budget: '', owner_id: '',
  })

  const analysts = profiles?.filter(p => p.role === 'analista') ?? []

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
        owner_id: form.owner_id || profile?.id || null,
        manager_id: profile?.id ?? null,
      })
      toast('Projeto criado com sucesso!', 'success')
      setShowCreate(false)
      setForm({ name: '', description: '', status: 'nao_iniciado', start_date: '', end_date: '', budget: '', owner_id: '' })
    } catch {
      toast('Erro ao criar projeto', 'error')
    }
  }

  const stats = useMemo(() => {
    if (!projects) return null
    return {
      total: projects.length,
      em_andamento: projects.filter(p => p.status === 'em_andamento').length,
      atrasado: projects.filter(p => p.status === 'atrasado').length,
      concluido: projects.filter(p => p.status === 'concluido').length,
      em_risco: projects.filter(p => p.status === 'em_risco').length,
    }
  }, [projects])

  const pieData = useMemo(() => {
    if (!projects) return []
    const counts: Partial<Record<ProjectStatus, number>> = {}
    projects.forEach(p => {
      counts[p.status] = (counts[p.status] ?? 0) + 1
    })
    return Object.entries(counts).map(([status, value]) => ({
      name: PROJECT_STATUS_LABEL[status as ProjectStatus],
      value,
      color: STATUS_COLORS[status as ProjectStatus],
    }))
  }, [projects])

  const analystStats = useMemo(() => {
    if (!projects || !profiles) return []
    const analysts = profiles.filter(p => p.role === 'analista')
    return analysts.map(analyst => {
      const myProjects = projects.filter(p => p.owner_id === analyst.id)
      return {
        analyst,
        total: myProjects.length,
        em_andamento: myProjects.filter(p => p.status === 'em_andamento').length,
        atrasado: myProjects.filter(p => p.status === 'atrasado').length,
        concluido: myProjects.filter(p => p.status === 'concluido').length,
      }
    }).filter(a => a.total > 0)
  }, [projects, profiles])

  const progressChartData = useMemo(() => {
    if (!projects) return []
    return projects.slice(0, 8).map(p => ({
      name: p.name.slice(0, 12) + (p.name.length > 12 ? '…' : ''),
      progress: p.progress,
    }))
  }, [projects])

  const alertProjects = useMemo(() => {
    if (!projects) return []
    return projects.filter(p => p.status === 'atrasado' || p.status === 'em_risco')
  }, [projects])

  const isGerente = profile?.role === 'gerente'

  return (
    <div>
      <PageHeader
        title={`Olá, ${profile?.full_name?.split(' ')[0] ?? 'usuário'} 👋`}
        subtitle={isGerente ? 'Visão consolidada de todos os projetos' : 'Seus projetos e atividades'}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Novo Projeto
          </Button>
        }
      />

      <div className="p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total de Projetos" value={stats?.total ?? 0} icon={<FolderKanban className="h-4 w-4" />} loading={isLoading} />
          <StatCard label="Em Andamento" value={stats?.em_andamento ?? 0} icon={<Clock className="h-4 w-4" />} color="text-accent" loading={isLoading} />
          <StatCard label="Atrasados" value={stats?.atrasado ?? 0} icon={<AlertTriangle className="h-4 w-4" />} color="text-danger" loading={isLoading} />
          <StatCard label="Concluídos" value={stats?.concluido ?? 0} icon={<CheckCircle className="h-4 w-4" />} color="text-success" loading={isLoading} />
        </div>

        {/* Alerts */}
        {alertProjects.length > 0 && (
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-warning">Projetos que precisam de atenção</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {alertProjects.map(p => (
                <Link key={p.id} to={`/projects/${p.id}`}>
                  <Badge className={`${PROJECT_STATUS_COLOR[p.status]} cursor-pointer hover:opacity-80`}>
                    {p.name} — {PROJECT_STATUS_LABEL[p.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects list */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Projetos Recentes</CardTitle>
              <Link to="/projects" className="text-xs text-accent hover:underline">Ver todos</Link>
            </CardHeader>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-black/5 animate-pulse" />
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="space-y-1">
                {projects.slice(0, 6).map(p => (
                  <ProjectRow key={p.id} project={p} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted text-center py-8">Nenhum projeto encontrado</p>
            )}
          </Card>

          {/* Pie chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Status</CardTitle>
            </CardHeader>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '8px', fontSize: '12px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-muted">{d.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted text-center py-8">Sem dados</p>
            )}
          </Card>
        </div>

        {/* Progress chart */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso por Projeto</CardTitle>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs text-muted">Últimos 8 projetos</span>
            </div>
          </CardHeader>
          {progressChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={progressChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v) => [`${v}%`, 'Progresso']}
                />
                <Line type="monotone" dataKey="progress" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted text-center py-8">Sem dados de progresso</p>
          )}
        </Card>

        {/* Analyst ranking (gerente only) */}
        {isGerente && analystStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance por Analista</CardTitle>
              <Users className="h-4 w-4 text-muted" />
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs text-muted font-medium">Analista</th>
                    <th className="text-center py-2 px-3 text-xs text-muted font-medium">Total</th>
                    <th className="text-center py-2 px-3 text-xs text-muted font-medium">Em Andamento</th>
                    <th className="text-center py-2 px-3 text-xs text-muted font-medium">Atrasados</th>
                    <th className="text-center py-2 px-3 text-xs text-muted font-medium">Concluídos</th>
                  </tr>
                </thead>
                <tbody>
                  {analystStats.map(({ analyst, total, em_andamento, atrasado, concluido }) => (
                    <tr key={analyst.id} className="border-b border-border/50 hover:bg-black/5">
                      <td className="py-3 px-3 text-foreground font-medium">{analyst.full_name}</td>
                      <td className="py-3 px-3 text-center text-muted">{total}</td>
                      <td className="py-3 px-3 text-center text-accent">{em_andamento}</td>
                      <td className="py-3 px-3 text-center text-danger">{atrasado}</td>
                      <td className="py-3 px-3 text-center text-success">{concluido}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Projeto" className="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome do projeto"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
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
              options={statusOptions}
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}
            />
            {isGerente && analysts.length > 0 && (
              <Select
                label="Analista Responsável"
                options={[{ value: '', label: 'Selecionar...' }, ...analysts.map(a => ({ value: a.id, label: a.full_name ?? a.id }))]}
                value={form.owner_id}
                onChange={e => setForm(f => ({ ...f, owner_id: e.target.value }))}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data de Início"
              type="date"
              value={form.start_date}
              onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
            />
            <Input
              label="Data de Entrega"
              type="date"
              value={form.end_date}
              onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
            />
          </div>
          <Input
            label="Orçamento (R$)"
            type="number"
            placeholder="0"
            value={form.budget}
            onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={createProject.isPending} className="flex-1">
              Criar Projeto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
