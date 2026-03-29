import { Avatar } from '@/components/ui/Avatar'
import { ExpenseStatusBadge } from '@/components/features/expenses/ExpenseStatusBadge'
import { formatDate } from '@/lib/utils'

export function ExpenseTimeline({ items }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id ?? index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Avatar name={item.actorName ?? item.approverName} className="h-10 w-10" />
            {index < items.length - 1 && <div className="mt-2 h-full w-px bg-border" />}
          </div>
          <div className="surface-card flex-1 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-card-foreground">{item.actorName ?? item.approverName}</p>
                <p className="text-sm text-muted-foreground capitalize">{item.action ?? item.status}</p>
              </div>
              <ExpenseStatusBadge status={item.action ?? item.status} />
            </div>
            {item.note || item.comment ? (
              <p className="mt-3 text-sm text-muted-foreground">{item.note ?? item.comment}</p>
            ) : null}
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {formatDate(item.timestamp ?? item.decidedAt ?? item.createdAt, 'MMM d, yyyy p')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
