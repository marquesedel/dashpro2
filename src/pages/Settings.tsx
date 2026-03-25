import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'

export default function Settings() {
  const { profile, updateProfile, updatePassword } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(profile?.full_name ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingName(true)
    try {
      await updateProfile({ full_name: name })
      toast('Nome atualizado!', 'success')
    } catch {
      toast('Erro ao atualizar nome', 'error')
    } finally {
      setSavingName(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast('As senhas não conferem', 'error')
      return
    }
    if (newPassword.length < 6) {
      toast('A senha deve ter pelo menos 6 caracteres', 'error')
      return
    }
    setSavingPassword(true)
    try {
      await updatePassword(newPassword)
      toast('Senha atualizada!', 'success')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast('Erro ao atualizar senha', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Gerencie suas informações pessoais" />

      <div className="p-8 max-w-lg space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-4">Informações do Perfil</h2>
          <form onSubmit={handleSaveName} className="space-y-4">
            <Input
              label="Nome completo"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground/70">Função</label>
              <p className="text-sm text-foreground capitalize bg-black/5 rounded-lg px-3 py-2">{profile?.role ?? '—'}</p>
            </div>
            <Button type="submit" loading={savingName}>Salvar Nome</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-4">Alterar Senha</h2>
          <form onSubmit={handleSavePassword} className="space-y-4">
            <Input
              label="Nova Senha"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Confirmar Nova Senha"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={savingPassword}>Atualizar Senha</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
