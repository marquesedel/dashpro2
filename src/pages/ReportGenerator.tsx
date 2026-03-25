import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useProject, useActions, useRisks } from '@/hooks/useProjects'
import { useGenerateReport, useSaveReport } from '@/hooks/useReports'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReportViewer } from '@/components/report/ReportViewer'
import { REPORT_TYPE_LABEL } from '@/lib/utils'
import type { ReportType } from '@/types'

const reportTypeOptions = Object.entries(REPORT_TYPE_LABEL).map(([value, label]) => ({ value, label }))

export default function ReportGenerator() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const { toast } = useToast()

  const { data: project } = useProject(id!)
  const { data: actions } = useActions(id!)
  const { data: risks } = useRisks(id!)

  const generateReport = useGenerateReport()
  const saveReport = useSaveReport()

  const [reportType, setReportType] = useState<ReportType>('semanal')
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const generatedAt = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const handleGenerate = async () => {
    if (!project || !profile) return
    try {
      /* 1. Gera o conteúdo via IA */
      const result = await generateReport.mutateAsync({
        type: reportType,
        project_name: project.name,
        status: project.status,
        progress: project.progress,
        start_date: project.start_date,
        end_date: project.end_date,
        budget: project.budget,
        spent: project.spent,
        actions: (actions ?? []).map(a => ({ title: a.title, status: a.status })),
        risks: (risks ?? []).map(r => ({ title: r.title, probability: r.probability, impact: r.impact, status: r.status })),
      })

      setGeneratedContent(result.content)

      /* 2. Salva automaticamente no projeto */
      await saveReport.mutateAsync({
        project_id: id!,
        generated_by: profile.id,
        content: result.content,
        type: reportType,
      })

      toast('Relatório gerado e salvo!', 'success')

      /* 3. Abre o preview */
      setPreviewOpen(true)
    } catch {
      toast('Erro ao gerar relatório. Verifique a Edge Function.', 'error')
    }
  }

  const isPending = generateReport.isPending || saveReport.isPending

  return (
    <>
      <PageHeader
        title="Gerar Relatório com IA"
        subtitle={project?.name}
        actions={
          <Link to={`/projects/${id}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Voltar ao Projeto</Button>
          </Link>
        }
      />

      <div className="p-8 max-w-4xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Configuração do Relatório</h2>
          <div className="flex items-end gap-4">
            <div className="w-52">
              <Select
                label="Tipo de Relatório"
                options={reportTypeOptions}
                value={reportType}
                onChange={e => setReportType(e.target.value as ReportType)}
              />
            </div>
            <Button onClick={handleGenerate} loading={isPending}>
              <Sparkles className="h-4 w-4" />
              {generateReport.isPending ? 'Gerando...' : saveReport.isPending ? 'Salvando...' : 'Gerar com IA'}
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-muted">
            <div className="rounded-lg bg-black/5 px-3 py-2">
              <p className="font-medium text-foreground mb-0.5">Ações</p>
              <p>{actions?.length ?? 0} atividades</p>
            </div>
            <div className="rounded-lg bg-black/5 px-3 py-2">
              <p className="font-medium text-foreground mb-0.5">Riscos</p>
              <p>{risks?.length ?? 0} identificados</p>
            </div>
            <div className="rounded-lg bg-black/5 px-3 py-2">
              <p className="font-medium text-foreground mb-0.5">Progresso</p>
              <p>{project?.progress ?? 0}% concluído</p>
            </div>
          </div>
        </div>

        {generatedContent && !previewOpen && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Relatório Gerado</h2>
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)}>
                Ver relatório completo
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="prose prose-slate prose-sm max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground/80 prose-p:leading-relaxed prose-li:text-foreground/80 prose-strong:text-foreground prose-hr:border-border">
                <ReactMarkdown>{generatedContent}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {!generatedContent && !isPending && (
          <div className="rounded-xl border border-border border-dashed p-12 text-center">
            <Sparkles className="h-8 w-8 text-accent mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted">Selecione o tipo de relatório e clique em "Gerar com IA"</p>
            <p className="text-xs text-muted mt-1">O relatório será salvo automaticamente no projeto</p>
          </div>
        )}
      </div>

      {/* Preview de tela cheia */}
      {previewOpen && generatedContent && project && (
        <ReportViewer
          project={project}
          actions={actions ?? []}
          risks={risks ?? []}
          reportType={reportType}
          content={generatedContent}
          generatedAt={generatedAt}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  )
}
