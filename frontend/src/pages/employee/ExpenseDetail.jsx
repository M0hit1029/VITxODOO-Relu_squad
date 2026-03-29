import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExpenseTimeline } from '@/components/features/expenses/ExpenseTimeline'
import { ExpenseStatusBadge } from '@/components/features/expenses/ExpenseStatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuthStore } from '@/store/authStore'

export default function ExpenseDetail() {
  const { id } = useParams()
  const { currentExpense, fetchExpense } = useExpenses()
  const company = useAuthStore((state) => state.company)
  const expense = currentExpense?.id === id ? currentExpense : null

  useEffect(() => {
    if (id) fetchExpense(id)
  }, [fetchExpense, id])

  if (!expense) {
    return <div className="surface-card p-10 text-center text-muted-foreground">Loading expense details...</div>
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{expense.description}</CardTitle>
            {expense.status === 'draft' && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/expenses/${expense.id}/edit`}>Continue Editing</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Date</p>
              <p className="mt-2 text-card-foreground">{formatDate(expense.expenseDate)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Category</p>
              <p className="mt-2 capitalize text-card-foreground">{expense.category}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Original amount</p>
              <p className="money-text mt-2 text-card-foreground">
                {formatCurrency(expense.amount, expense.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Base amount</p>
              <p className="money-text mt-2 text-card-foreground">
                {formatCurrency(expense.amountInBase, company?.baseCurrency ?? expense.baseCurrency ?? 'INR')}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Remarks</p>
              <p className="mt-2 text-card-foreground">{expense.remarks || 'No remarks added.'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseTimeline items={expense.logs} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExpenseStatusBadge status={expense.status} />
            <div className="space-y-3">
              {expense.approvalChain.map((step) => (
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
