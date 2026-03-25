/**
 * ReportViewer — componente compartilhado usado em:
 *   - ReportGenerator (preview após geração)
 *   - ProjectDetail (abertura de relatório salvo)
 *
 * Responsabilidades:
 *   - Renderizar o relatório completo como HTML (capa + gráficos + tabelas + IA)
 *   - Toolbar com "Baixar PDF" (nova janela + print) e "Enviar por email"
 */

import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Download, Mail, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  REPORT_TYPE_LABEL, PROJECT_STATUS_LABEL,
  ACTION_STATUS_LABEL, RISK_PROBABILITY_LABEL,
  RISK_IMPACT_LABEL, RISK_STATUS_LABEL,
  formatDate, formatCurrency,
} from '@/lib/utils'
import type { Project, Action, Risk, ReportType, RiskProbability, RiskImpact } from '@/types'

/* ── Color helpers ── */

const ACTION_STATUS_COLORS: Record<string, string> = {
  pendente: '#f59e0b',
  em_andamento: '#6366f1',
  concluida: '#22c55e',
  bloqueada: '#ef4444',
}

const riskLevel = (prob: RiskProbability, imp: RiskImpact): string => {
  const score = { baixa: 1, media: 2, alta: 3 }[prob] * { baixo: 1, medio: 2, alto: 3 }[imp]
  if (score >= 6) return '#ef4444'
  if (score >= 3) return '#f59e0b'
  return '#22c55e'
}

/* ── Inner visual components (all inline-styled for print portability) ── */

function CircularProgress({ value }: { value: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  const color = value >= 75 ? '#22c55e' : value >= 40 ? '#6366f1' : '#f59e0b'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width="96" height="96" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" />
        <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f172a">{value}%</text>
      </svg>
      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Progresso Geral</span>
    </div>
  )
}

function BudgetBar({ budget, spent }: { budget: number | null; spent: number }) {
  const total = budget ?? spent
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0
  const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e'
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6, color: '#64748b' }}>
        <span>Gasto: {formatCurrency(spent)}</span>
        <span>Orçamento: {formatCurrency(budget)}</span>
      </div>
      <div style={{ height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5 }} />
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{pct.toFixed(1)}% do orçamento utilizado</div>
    </div>
  )
}

function PieChart({ actions }: { actions: Action[] }) {
  const counts: Record<string, number> = { pendente: 0, em_andamento: 0, concluida: 0, bloqueada: 0 }
  actions.forEach(a => { counts[a.status] = (counts[a.status] ?? 0) + 1 })
  const total = actions.length
  if (total === 0) return <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Nenhuma ação registrada.</p>

  let cum = 0
  const slices = Object.entries(counts).filter(([, v]) => v > 0).map(([st, count]) => {
    const pct = count / total; const start = cum; cum += pct
    const a0 = start * 2 * Math.PI - Math.PI / 2
    const a1 = cum * 2 * Math.PI - Math.PI / 2
    const r = 45
    const path = `M50,50 L${50 + r * Math.cos(a0)},${50 + r * Math.sin(a0)} A${r},${r} 0 ${pct > 0.5 ? 1 : 0},1 ${50 + r * Math.cos(a1)},${50 + r * Math.sin(a1)} Z`
    return { st, count, path, color: ACTION_STATUS_COLORS[st] ?? '#94a3b8' }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width="96" height="96" viewBox="0 0 100 100">
        {slices.map(s => <path key={s.st} d={s.path} fill={s.color} stroke="#fff" strokeWidth="1.5" />)}
      </svg>
      <div style={{ fontSize: 12, lineHeight: '2' }}>
        {slices.map(s => (
          <div key={s.st} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: '#334155' }}>{ACTION_STATUS_LABEL[s.st as keyof typeof ACTION_STATUS_LABEL]}: <strong>{s.count}</strong></span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Report HTML content ── */

interface ReportContentProps {
  project: Project
  actions: Action[]
  risks: Risk[]
  reportType: ReportType
  content: string
  generatedAt: string
}

export function ReportContent({ project, actions, risks, reportType, content, generatedAt }: ReportContentProps) {
  const s = {
    root: { background: '#fff', fontFamily: "'Inter', system-ui, sans-serif", color: '#0f172a' } as React.CSSProperties,
    coverAccent: { height: 8, background: 'linear-gradient(90deg, #6366f1, #818cf8)' },
    coverBody: { padding: '48px 48px 32px', display: 'flex', flexDirection: 'column' as const },
    coverLogo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 },
    coverLogoIcon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 8 },
    coverType: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 2, color: '#6366f1', marginBottom: 8 },
    coverTitle: { fontSize: 36, fontWeight: 800, lineHeight: 1.2, margin: '0 0 12px' },
    coverDesc: { fontSize: 14, color: '#64748b', maxWidth: 520, lineHeight: 1.6, margin: '0 0 40px' },
    metaBox: { display: 'flex', alignItems: 'center', padding: '16px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 },
    metaItem: { display: 'flex', flexDirection: 'column' as const, gap: 3, padding: '0 20px' },
    metaLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    metaValue: { fontSize: 13, fontWeight: 600 },
    metaSep: { width: 1, height: 32, background: '#e2e8f0' },
    coverFooter: { padding: '16px 48px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' },
    body: { padding: '32px 48px 48px' },
    sectionTitle: { fontSize: 14, fontWeight: 700, borderLeft: '3px solid #6366f1', paddingLeft: 10, margin: '0 0 16px' },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
    card: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px' },
    cardLabel: { fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 10 },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 12, marginBottom: 28 },
    thead: { background: '#6366f1' },
    th: { color: '#fff', fontWeight: 600, textAlign: 'left' as const, padding: '8px 12px', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    divider: { border: 'none', borderTop: '1px solid #e2e8f0', margin: '28px 0' },
    aiContent: { fontSize: 13, lineHeight: 1.8, color: '#334155' },
    footer: { marginTop: 40, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', paddingBottom: 8 },
  }

  const td = (i: number) => ({
    padding: '8px 12px', borderBottom: '1px solid #e2e8f0',
    background: i % 2 === 0 ? '#fff' : '#f8fafc',
    verticalAlign: 'middle' as const,
    fontSize: 12,
  })

  return (
    <div style={s.root}>
      {/* ── Capa ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', marginBottom: 0 }}>
        <div style={s.coverAccent} />
        <div style={s.coverBody}>
          <div style={s.coverLogo}>
            <span style={s.coverLogoIcon}>DP</span>
            <strong style={{ fontSize: 16, fontWeight: 700 }}>DashPro</strong>
          </div>
          <div style={s.coverType}>{REPORT_TYPE_LABEL[reportType]}</div>
          <h1 style={s.coverTitle}>{project.name}</h1>
          {project.description && <p style={s.coverDesc}>{project.description}</p>}
          <div style={s.metaBox}>
            <div style={s.metaItem}>
              <span style={s.metaLabel}>Status</span>
              <strong style={s.metaValue}>{PROJECT_STATUS_LABEL[project.status]}</strong>
            </div>
            <div style={s.metaSep} />
            <div style={s.metaItem}>
              <span style={s.metaLabel}>Início</span>
              <strong style={s.metaValue}>{formatDate(project.start_date)}</strong>
            </div>
            <div style={s.metaSep} />
            <div style={s.metaItem}>
              <span style={s.metaLabel}>Entrega</span>
              <strong style={s.metaValue}>{formatDate(project.end_date)}</strong>
            </div>
            <div style={s.metaSep} />
            <div style={s.metaItem}>
              <span style={s.metaLabel}>Responsável</span>
              <strong style={s.metaValue}>{(project.owner as { full_name?: string } | undefined)?.full_name ?? '—'}</strong>
            </div>
          </div>
        </div>
        <div style={s.coverFooter}>
          <span>Gerado em {generatedAt}</span>
          <span>DashPro — Gestão Inteligente de Projetos</span>
        </div>
      </div>

      {/* ── Corpo ── */}
      <div style={s.body}>
        {/* Visão geral */}
        <h2 style={s.sectionTitle}>Visão Geral do Projeto</h2>
        <div style={s.grid3}>
          <div style={{ ...s.card, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress value={project.progress} />
          </div>
          <div style={{ ...s.card, gridColumn: 'span 2' }}>
            <div style={s.cardLabel}>Orçamento vs. Realizado</div>
            <BudgetBar budget={project.budget} spent={project.spent} />
            <div style={{ display: 'flex', gap: 28, marginTop: 16 }}>
              {[
                { label: 'Total', value: formatCurrency(project.budget) },
                { label: 'Gasto', value: formatCurrency(project.spent) },
                { label: 'Saldo', value: formatCurrency((project.budget ?? 0) - project.spent), color: '#22c55e' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: color ?? '#0f172a' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {actions.length > 0 && (
          <div style={{ ...s.card, marginBottom: 24 }}>
            <div style={s.cardLabel}>Distribuição de Ações</div>
            <PieChart actions={actions} />
          </div>
        )}

        <hr style={s.divider} />

        {/* Ações */}
        {actions.length > 0 && (
          <>
            <h2 style={s.sectionTitle}>Ações do Projeto</h2>
            <table style={s.table}>
              <thead style={s.thead}>
                <tr>
                  <th style={s.th}>Ação</th>
                  <th style={{ ...s.th, width: 120 }}>Status</th>
                  <th style={{ ...s.th, width: 100 }}>Prazo</th>
                  <th style={{ ...s.th, width: 140 }}>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a, i) => {
                  const color = ACTION_STATUS_COLORS[a.status] ?? '#94a3b8'
                  return (
                    <tr key={a.id}>
                      <td style={td(i)}>{a.title}</td>
                      <td style={td(i)}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: color + '22', color }}>
                          {ACTION_STATUS_LABEL[a.status]}
                        </span>
                      </td>
                      <td style={td(i)}>{formatDate(a.due_date)}</td>
                      <td style={td(i)}>{(a.user as { full_name?: string } | undefined)?.full_name ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}

        {/* Riscos */}
        {risks.length > 0 && (
          <>
            <h2 style={s.sectionTitle}>Matriz de Riscos</h2>
            <table style={s.table}>
              <thead style={s.thead}>
                <tr>
                  <th style={s.th}>Risco</th>
                  <th style={{ ...s.th, width: 110 }}>Probabilidade</th>
                  <th style={{ ...s.th, width: 90 }}>Impacto</th>
                  <th style={{ ...s.th, width: 80 }}>Nível</th>
                  <th style={{ ...s.th, width: 100 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((r, i) => {
                  const lvl = riskLevel(r.probability, r.impact)
                  return (
                    <tr key={r.id}>
                      <td style={td(i)}>{r.title}</td>
                      <td style={td(i)}>{RISK_PROBABILITY_LABEL[r.probability]}</td>
                      <td style={td(i)}>{RISK_IMPACT_LABEL[r.impact]}</td>
                      <td style={td(i)}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: lvl + '22', color: lvl }}>
                          {lvl === '#ef4444' ? 'Alto' : lvl === '#f59e0b' ? 'Médio' : 'Baixo'}
                        </span>
                      </td>
                      <td style={td(i)}>{RISK_STATUS_LABEL[r.status]}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}

        <hr style={s.divider} />

        {/* Análise IA */}
        <h2 style={s.sectionTitle}>Análise e Recomendações</h2>
        <div style={s.aiContent}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {/* Rodapé */}
        <div style={s.footer}>
          <span>{project.name} — Relatório {REPORT_TYPE_LABEL[reportType]}</span>
          <span>Gerado por IA · {generatedAt}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Overlay de tela cheia com toolbar ── */

interface ReportViewerProps {
  project: Project
  actions: Action[]
  risks: Risk[]
  reportType: ReportType
  content: string
  generatedAt: string
  onClose: () => void
}

export function ReportViewer({ project, actions, risks, reportType, content, generatedAt, onClose }: ReportViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [emailTo, setEmailTo] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)

  const handleDownloadPdf = () => {
    if (!contentRef.current) return
    const safeName = project.name.replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '_')
    const filename = `Relatorio_${safeName}_${reportType}`
    const html = contentRef.current.innerHTML

    const win = window.open('', '_blank', 'width=960,height=800')
    if (!win) { alert('Permita popups para baixar o PDF.'); return }

    win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 0; background: #fff; font-family: 'Inter', system-ui, sans-serif; }
    @page { margin: 12mm 14mm; size: A4 portrait; }
  </style>
</head>
<body>
  ${html}
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };<\/script>
</body>
</html>`)
    win.document.close()
  }

  const handleSendEmail = () => {
    const email = emailTo.trim()
    if (!email) return
    const subject = encodeURIComponent(`Relatório ${REPORT_TYPE_LABEL[reportType]} — ${project.name}`)
    const body = encodeURIComponent(
      `Olá!\n\nSegue o relatório ${REPORT_TYPE_LABEL[reportType].toLowerCase()} do projeto "${project.name}" gerado pelo DashPro.\n\nData de geração: ${generatedAt}\n\nPara visualizar o PDF completo, acesse a plataforma e abra o relatório.\n\nDashPro — Gestão Inteligente de Projetos`
    )
    window.open(`mailto:${email}?subject=${subject}&body=${body}`)
    setShowEmailInput(false)
    setEmailTo('')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">{project.name}</span>
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent flex-shrink-0">
            {REPORT_TYPE_LABEL[reportType]}
          </span>
          <span className="text-xs text-muted flex-shrink-0 hidden sm:block">{generatedAt}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {showEmailInput ? (
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="destinatario@email.com"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
                className="h-8 text-xs w-52"
              />
              <Button variant="secondary" size="sm" onClick={handleSendEmail} disabled={!emailTo.trim()}>
                Enviar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowEmailInput(false); setEmailTo('') }}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setShowEmailInput(true)}>
              <Mail className="h-3.5 w-3.5" /> E-mail
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleDownloadPdf}>
            <Download className="h-3.5 w-3.5" /> Baixar PDF
          </Button>
          <button
            onClick={onClose}
            className="ml-1 rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-y-auto bg-slate-100 py-8 px-4">
        <div className="mx-auto max-w-3xl shadow-xl rounded-lg overflow-hidden bg-white">
          <div ref={contentRef}>
            <ReportContent
              project={project}
              actions={actions}
              risks={risks}
              reportType={reportType}
              content={content}
              generatedAt={generatedAt}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
