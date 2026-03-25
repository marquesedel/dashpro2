import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
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

interface RequestBody {
  messages: ChatMessage[]
  context: { projects: ProjectContext[] }
}

function buildSystemPrompt(projects: ProjectContext[]): string {
  const today = new Date().toLocaleDateString('pt-BR')

  const projectsSummary = projects.map(p => {
    const actionsText = p.actions.length > 0
      ? p.actions.map(a => `    - ${a.title} [${a.status}]`).join('\n')
      : '    (sem ações cadastradas)'

    const risksText = p.risks.length > 0
      ? p.risks.map(r => `    - ${r.title} | probabilidade: ${r.probability}, impacto: ${r.impact}, status: ${r.status}`).join('\n')
      : '    (sem riscos cadastrados)'

    const budgetPct = p.budget && p.budget > 0
      ? `${((p.spent / p.budget) * 100).toFixed(1)}% utilizado`
      : 'orçamento não definido'

    return `### Projeto: ${p.name}
  - Status: ${p.status}
  - Progresso: ${p.progress}%
  - Orçamento: R$ ${p.budget?.toLocaleString('pt-BR') ?? '—'} | Gasto: R$ ${p.spent.toLocaleString('pt-BR')} (${budgetPct})
  - Período: ${p.start_date ?? '—'} até ${p.end_date ?? '—'}
  - Ações (${p.actions.length}):
${actionsText}
  - Riscos (${p.risks.length}):
${risksText}`
  }).join('\n\n')

  return `Você é o DashChat, assistente inteligente da plataforma DashPro de gestão de projetos.
Hoje é ${today}. Você tem acesso em tempo real ao portfólio de projetos do usuário.

Responda sempre em português brasileiro de forma clara, objetiva e profissional.
Use markdown nas respostas quando ajudar (listas, negrito, tabelas).
Se o usuário perguntar algo fora do contexto de projetos, redirecione gentilmente.

## Portfólio Atual (${projects.length} projeto${projects.length !== 1 ? 's' : ''})

${projectsSummary || 'Nenhum projeto cadastrado ainda.'}

---
Com base nesse contexto, responda às perguntas do usuário sobre os projetos, prazos, riscos, tarefas e status geral.`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const body: RequestBody = await req.json()
    const { messages, context } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages inválidas' }), { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(context?.projects ?? [])

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.6,
        max_tokens: 1200,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenAI error: ${err}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content ?? 'Não foi possível gerar uma resposta.'

    return new Response(JSON.stringify({ reply }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
