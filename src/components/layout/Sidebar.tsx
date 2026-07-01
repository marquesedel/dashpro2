import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Settings, LogOut, ChevronRight, MessageSquareText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: undefined },
  { to: '/projects', icon: FolderKanban, label: 'Projetos', badge: undefined },
  { to: '/chat', icon: MessageSquareText, label: 'RelataChat', badge: 'IA' },
  { to: '/settings', icon: Settings, label: 'Configurações', badge: undefined },
]

export function Sidebar() {
  const location = useLocation()
  const { profile, signOut } = useAuth()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="text-xs font-bold text-white">RA</span>
        </div>
        <span className="text-base font-semibold text-foreground">RelataAI</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/')
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent/10 text-accent'
                  : 'text-foreground/60 hover:bg-black/5 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {badge && (
                <span className="ml-auto rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent leading-none">
                  {badge}
                </span>
              )}
              {active && !badge && <ChevronRight className="ml-auto h-3 w-3" />}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <div className="mb-2 px-3 py-2">
          <p className="text-sm font-medium text-foreground truncate">{profile?.full_name ?? 'Usuário'}</p>
          <p className="text-xs text-muted capitalize">{profile?.role ?? '—'}</p>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/60 hover:bg-black/5 hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
