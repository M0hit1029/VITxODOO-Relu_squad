import { ReceiptText, CircleCheckBig, Clock3, OctagonAlert, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatCard } from '@/components/features/dashboard/StatCard'
import { SpendingChart } from '@/components/features/dashboard/SpendingChart'
import { CategoryBreakdown } from '@/components/features/dashboard/CategoryBreakdown'
import { RecentActivityFeed } from '@/components/features/dashboard/RecentActivityFeed'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ExpenseStatusBadge } from '@/components/features/expenses/ExpenseStatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getEmployeeDashboard } from '@/services/expenseService'
import { useAuthStore } from '@/store/authStore'

const iconMap = [ReceiptText, Clock3, CircleCheckBig, OctagonAlert]

export default function EmployeeDashboard() {
  const user = useAuthStore((state) => state.user)
  const [dashboard, setDashboard] = useState(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!user || fetchedRef.current) return
    fetchedRef.current = true
    getEmployeeDashboard(user).then(setDashboard)
  }, [user])

  if (!dashboard) {
    return <div className="surface-card p-10 text-center text-muted-foreground">Loading dashboard…</div>
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground">
            Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's your expense summary</p>
        </div>
        <Button asChild>
          <Link to="/expenses/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New Expense
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.stats.map((stat, index) => {
          const Icon = iconMap[index]
          return (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={Icon}
              kind={stat.kind}
              color={stat.label === 'Rejected' ? 'destructive' : 'default'}
              trend={{ direction: index % 2 === 0 ? 'up' : 'down', percent: 8 + index * 3 }}
            />
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <SpendingChart data={dashboard.spendingByMonth} />
        <CategoryBreakdown data={dashboard.categoryBreakdown} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Expenses</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/expenses">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 px-4 py-3 transition-colors hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-card-foreground">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(expense.expenseDate)} • {expense.employeeName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="money-text text-sm font-semibold text-card-foreground">
                    {formatCurrency(expense.amountInBase, 'INR')}
                  </p>
                  <ExpenseStatusBadge status={expense.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <RecentActivityFeed items={dashboard.recentExpenses} />
      </div>
    </div>
  )
}
