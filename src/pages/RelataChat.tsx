import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, Sparkles, Trash2, Bot, User, AlertCircle, FolderKanban, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProjects } from '@/hooks/useProjects'
import { useChat } from '@/hooks/useChat'
import { cn, PROJECT_STATUS_COLOR } from '@/lib/utils'
import type { Project, Action, Risk } from '@/types'

/* ── Suggested prompts shown before the first message ── */
const SUGGESTED = [
  'Qual projeto está mais atrasado?',
  'Quais tarefas estão bloqueadas?',
  'Resuma o status geral do portfólio.',
  'Quais são os riscos críticos abertos?',
  'Qual projeto tem maior risco orçamentário?',
  'Mostre as tarefas pendentes de todos os projetos.',
]

/* ── Hook to load all actions + risks for all projects ── */
function useAllProjectsData(projects: Project[] | undefined) {
  const ids = (projects ?? []).map(p => p.id)

  // We need per-project data. We call individual hooks which is not ideal
  // for dynamic lists, so we load them via a single batch Supabase query instead.
  const [actionsByProject, setActionsByProject] = useState<Record<string, Action[]>>({})
  const [risksByProject, setRisksByProject] = useState<Record<string, Risk[]>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!ids.length) { setLoaded(true); return }

    const load = async () => {
      const [actionsRes, risksRes] = await Promise.all([
        supabase.from('actions').select('*').in('project_id', ids),
        supabase.from('risks').select('*').in('project_id', ids),
      ])

      const aByP: Record<string, Action[]> = {}
      const rByP: Record<string, Risk[]> = {}

      for (const a of actionsRes.data ?? []) {
        if (!aByP[a.project_id]) aByP[a.project_id] = []
        aByP[a.project_id].push(a as Action)
      }
      for (const r of risksRes.data ?? []) {
        if (!rByP[r.project_id]) rByP[r.project_id] = []
        rByP[r.project_id].push(r as Risk)
      }

      setActionsByProject(aByP)
      setRisksByProject(rByP)
      setLoaded(true)
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')])

  return { actionsByProject, risksByProject, loaded }
}

/* ── Project context sidebar pills ── */
function ProjectContextPanel({ projects }: { projects: Project[] }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? projects : projects.slice(0, 6)

  return (
    <div className="border-b border-border px-4 py-3 bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide flex items-center gap-1.5">
          <FolderKanban className="h-3 w-3" /> Contexto — {projects.length} projeto{projects.length !== 1 ? 's' : ''}
        </span>
        {projects.length > 6 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-accent hover:underline flex items-center gap-0.5"
          >
            {expanded ? <><ChevronUp className="h-3 w-3" /> Menos</> : <><ChevronDown className="h-3 w-3" /> +{projects.length - 6} mais</>}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {shown.map(p => (
          <span
            key={p.id}
            className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', PROJECT_STATUS_COLOR[p.status])}
          >
            {p.name}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Individual chat bubble ── */
function MessageBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-0.5',
        isUser ? 'bg-accent text-white' : 'bg-accent/10 text-accent border border-accent/20',
      )}>
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
        isUser
          ? 'bg-accent text-white rounded-tr-sm'
          : 'bg-card border border-border text-foreground rounded-tl-sm',
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className={cn(
            'prose prose-sm max-w-none',
            'prose-p:my-1 prose-p:leading-relaxed',
            'prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1',
            'prose-ul:my-1 prose-li:my-0.5',
            'prose-strong:font-semibold',
            'prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:bg-black/5',
            'prose-table:text-xs',
            'prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground',
          )}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center bg-accent/10 text-accent border border-accent/20">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-1 bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Empty state with suggested prompts ── */
function EmptyState({ onSuggest }: { onSuggest: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 border border-accent/20">
        <Sparkles className="h-6 w-6 text-accent" />
      </div>
      <h2 className="text-base font-semibold text-foreground mb-1">RelataChat</h2>
      <p className="text-sm text-muted max-w-sm mb-8">
        Pergunte sobre seus projetos, tarefas, prazos e riscos. A IA tem contexto de todo o seu portfólio.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
        {SUGGESTED.map(s => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="text-left text-sm rounded-xl border border-border bg-card px-4 py-3 text-foreground/70 hover:border-accent/40 hover:bg-accent/5 hover:text-foreground transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function RelataChat() {
  const { data: projects } = useProjects()
  const { actionsByProject, risksByProject, loaded } = useAllProjectsData(projects)
  const { messages, loading, error, sendMessage, clearMessages } = useChat()

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  const handleSend = () => {
    if (!input.trim() || loading || !loaded) return
    sendMessage(input, projects ?? [], actionsByProject, risksByProject)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggest = (s: string) => {
    setInput(s)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">RelataChat</h1>
            <p className="text-xs text-muted">Assistente inteligente de projetos</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:bg-black/5 hover:text-foreground transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Nova conversa
          </button>
        )}
      </div>

      {/* Context bar */}
      {projects && projects.length > 0 && (
        <ProjectContextPanel projects={projects} />
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onSuggest={handleSuggest} />
        ) : (
          <div className="py-2">
            {messages.map(m => (
              <MessageBubble key={m.id} role={m.role} content={m.content} />
            ))}
            {loading && <TypingIndicator />}
            {error && (
              <div className="mx-4 my-2 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-border bg-card px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-xl border border-border bg-background px-4 py-3 focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={loaded ? 'Pergunte sobre seus projetos… (Enter para enviar)' : 'Carregando contexto…'}
              rows={1}
              disabled={!loaded || loading}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none disabled:opacity-50 leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || !loaded}
              className={cn(
                'flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                input.trim() && loaded && !loading
                  ? 'bg-accent text-white hover:bg-accent/90'
                  : 'bg-black/5 text-muted cursor-not-allowed',
              )}
            >
              {loading
                ? <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Send className="h-3.5 w-3.5" />
              }
            </button>
          </div>
          <p className="mt-1.5 text-center text-xs text-muted">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  )
}
