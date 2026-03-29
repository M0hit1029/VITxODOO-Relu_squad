import { LayoutDashboard, ReceiptText, Users, Wallet, ArrowUpRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { RecentActivityFeed } from '@/components/features/dashboard/RecentActivityFeed'
import { StatCard } from '@/components/features/dashboard/StatCard'
import { ExpenseStatusBadge } from '@/components/features/expenses/ExpenseStatusBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { getAdminDashboard } from '@/services/expenseService'
import { useAuthStore } from '@/store/authStore'

const iconMap = [Wallet, LayoutDashboard, ReceiptText, Users]

export default function AdminDashboard() {
  const company = useAuthStore((state) => state.company)
  const [dashboard, setDashboard] = useState(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    getAdminDashboard().then(setDashboard)
  }, [])

  if (!dashboard) {
    return <div className="surface-card p-10 text-center text-muted-foreground">Loading admin dashboard…</div>
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Company-wide overview</p>
        </div>
        <Button asChild>
          <Link to="/admin/expenses">
            View All Expenses <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.stats.map((stat, index) => (
          <StatCard key={stat.label} {...stat} icon={iconMap[index]} currency={stat.currency ?? company?.baseCurrency} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Company Expenses</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/expenses">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-4 py-3 transition-colors hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-card-foreground">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">{expense.employeeName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="money-text text-sm font-semibold text-card-foreground">
                    {formatCurrency(expense.amountInBase, company?.baseCurrency ?? expense.baseCurrency ?? 'INR')}
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
