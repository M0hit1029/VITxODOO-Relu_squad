import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ExpenseTimeline } from '@/components/features/expenses/ExpenseTimeline'
import { ExpenseStatusBadge } from '@/components/features/expenses/ExpenseStatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuthStore } from '@/store/authStore'

export default function ApprovalDetail() {
  const { id } = useParams()
  const { currentExpense, fetchExpense } = useExpenses()
  const company = useAuthStore((state) => state.company)
  const expense = currentExpense?.id === id ? currentExpense : null

  useEffect(() => {
    if (id) fetchExpense(id)
  }, [fetchExpense, id])

  if (!expense) {
    return <div className="surface-card p-10 text-center text-muted-foreground">Loading approval detail...</div>
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>{expense.description}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Submitted</p>
              <p className="mt-2 text-card-foreground">{formatDate(expense.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Amount</p>
              <p className="money-text mt-2 text-card-foreground">
                {formatCurrency(expense.amount, expense.currency)} {' • '}
                {formatCurrency(expense.amountInBase, company?.baseCurrency ?? expense.baseCurrency ?? 'INR')}
              </p>
            </div>
          </div>
          <ExpenseTimeline items={expense.logs} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExpenseStatusBadge status={expense.status} />
          {expense.approvalChain.map((step) => (
            <div key={step.id} className="rounded-2xl border border-border/70 px-4 py-3">
              <p className="font-medium text-card-foreground">{step.approverName}</p>
              <p className="text-sm text-muted-foreground capitalize">{step.role}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
