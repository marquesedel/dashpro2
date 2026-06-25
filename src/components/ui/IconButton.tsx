import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type IconButtonTone = 'accent' | 'danger' | 'success' | 'warning' | 'neutral'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: IconButtonTone
  size?: 'sm' | 'md'
  children: React.ReactNode
}

const toneStyles: Record<IconButtonTone, string> = {
  accent: 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20',
  danger: 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20',
  success: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
  neutral: 'bg-black/5 text-muted border-border hover:bg-black/10 hover:text-foreground',
}

const sizeStyles = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, tone = 'accent', size = 'md', children, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex flex-shrink-0 items-center justify-center rounded-lg border transition-colors',
          toneStyles[tone],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
IconButton.displayName = 'IconButton'
