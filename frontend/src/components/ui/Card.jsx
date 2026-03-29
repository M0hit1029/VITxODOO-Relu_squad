import { cn } from '@/lib/utils'

export function Card({ className, children }) {
  return <div className={cn('surface-card', className)}>{children}</div>
}

export function CardHeader({ className, children }) {
  return <div className={cn('flex flex-col gap-2 p-5', className)}>{children}</div>
}

export function CardTitle({ className, children }) {
  return <h3 className={cn('font-display text-xl text-card-foreground', className)}>{children}</h3>
}

export function CardDescription({ className, children }) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
}

export function CardContent({ className, children }) {
  return <div className={cn('p-5 pt-0', className)}>{children}</div>
}
