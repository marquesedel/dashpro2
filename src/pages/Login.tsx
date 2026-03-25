import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <span className="text-sm font-bold text-foreground">DP</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">DashPro</h1>
            <p className="text-xs text-muted">Gestão inteligente de projetos</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-1">Entrar na plataforma</h2>
          <p className="text-sm text-muted mb-6">Use suas credenciais para acessar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
