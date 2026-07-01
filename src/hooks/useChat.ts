import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Project, Action, Risk } from '@/types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface ProjectContext {
  id: string
  name: string
  status: string
  progress: number
  budget: number | null
  spent: number
  start_date: string | null
  end_date: string | null
  actions: { title: string; status: string }[]
  risks: { title: string; probability: string; impact: string; status: string }[]
}

function buildContext(
  projects: Project[],
  actionsByProject: Record<string, Action[]>,
  risksByProject: Record<string, Risk[]>,
): ProjectContext[] {
  return projects.map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    progress: p.progress,
    budget: p.budget,
    spent: p.spent,
    start_date: p.start_date,
    end_date: p.end_date,
    actions: (actionsByProject[p.id] ?? []).map(a => ({ title: a.title, status: a.status })),
    risks: (risksByProject[p.id] ?? []).map(r => ({
      title: r.title,
      probability: r.probability,
      impact: r.impact,
      status: r.status,
    })),
  }))
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (
    userText: string,
    projects: Project[],
    actionsByProject: Record<string, Action[]>,
    risksByProject: Record<string, Risk[]>,
  ) => {
    if (!userText.trim() || loading) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userText.trim(),
      createdAt: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setError(null)

    const context = buildContext(projects, actionsByProject, risksByProject)

    // Build the history to send (last 20 messages to keep context manageable)
    const history = [...messages, userMsg]
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const headers = await getAuthHeaders()
      const { data, error: fnError } = await supabase.functions.invoke('dashchat', {
        body: { messages: history, context: { projects: context } },
        headers,
      })

      if (fnError) throw fnError

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.reply ?? 'Não foi possível gerar uma resposta.',
        createdAt: new Date(),
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao conectar com o RelataChat.'
      setError(msg)
      // Remove the optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, loading, error, sendMessage, clearMessages }
}
