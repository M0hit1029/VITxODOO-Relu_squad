import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ExpenseTimeline } from '@/components/features/expenses/ExpenseTimeline'
import { ExpenseStatusBadge } from '@/components/features/expenses/ExpenseStatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useExpenses } from '@/hooks/useExpenses'

export default function ExpenseDetail() {
  const { id } = useParams()
  const { currentExpense, fetchExpense } = useExpenses()

  useEffect(() => {
    if (id) fetchExpense(id)
  }, [fetchExpense, id])

  if (!currentExpense) {
    return <div className="surface-card p-10 text-center text-muted-foreground">Loading expense details…</div>
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{currentExpense.description}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Date</p>
              <p className="mt-2 text-card-foreground">{formatDate(currentExpense.expenseDate)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Category</p>
              <p className="mt-2 capitalize text-card-foreground">{currentExpense.category}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Original amount</p>
              <p className="money-text mt-2 text-card-foreground">
                {formatCurrency(currentExpense.amount, currentExpense.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Base amount</p>
              <p className="money-text mt-2 text-card-foreground">
                {formatCurrency(currentExpense.amountInBase, 'INR')}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Remarks</p>
              <p className="mt-2 text-card-foreground">{currentExpense.remarks || 'No remarks added.'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseTimeline items={currentExpense.logs} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExpenseStatusBadge status={currentExpense.status} />
            <div className="space-y-3">
              {currentExpense.approvalChain.map((step) => (
                <div key={step.id} className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3">
                  <Avatar name={step.approverName} className="h-9 w-9" />
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">{step.approverName}</p>
                    <p className="text-sm text-muted-foreground capitalize">{step.role}</p>
                  </div>
                  <ExpenseStatusBadge status={step.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
