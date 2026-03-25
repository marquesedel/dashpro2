import { createContext, useContext, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground shadow-xl border',
              t.type === 'success' && 'bg-success/20 border-success/30',
              t.type === 'error' && 'bg-danger/20 border-danger/30',
              t.type === 'info' && 'bg-accent/20 border-accent/30',
            )}
          >
            {t.type === 'success' && <CheckCircle className="h-4 w-4 text-success" />}
            {t.type === 'error' && <AlertCircle className="h-4 w-4 text-danger" />}
            {t.type === 'info' && <Info className="h-4 w-4 text-accent" />}
            {t.message}
            <button onClick={() => remove(t.id)} className="ml-2 text-foreground/50 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
