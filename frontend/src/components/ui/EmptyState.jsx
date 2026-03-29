import { Button } from '@/components/ui/Button'

export function EmptyState({ illustration, title, description, action }) {
  return (
    <div className="surface-card flex min-h-[260px] flex-col items-center justify-center gap-4 p-8 text-center">
      {illustration}
      <div className="space-y-2">
        <h3 className="font-display text-2xl text-card-foreground">{title}</h3>
        {description && <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
