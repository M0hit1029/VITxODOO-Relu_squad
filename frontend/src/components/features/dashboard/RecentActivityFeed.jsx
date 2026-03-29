import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ExpenseStatusBadge } from '@/components/features/expenses/ExpenseStatusBadge'
import { formatDate } from '@/lib/utils'

export function RecentActivityFeed({ items }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 px-4 py-3">
            <div>
              <p className="font-medium text-card-foreground">{item.description}</p>
              <p className="text-sm text-muted-foreground">{formatDate(item.updatedAt, 'MMM d, yyyy')}</p>
            </div>
            <ExpenseStatusBadge status={item.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
