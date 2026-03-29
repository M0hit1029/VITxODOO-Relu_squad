import { Download, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ExpenseStatusBadge } from '@/components/features/expenses/ExpenseStatusBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useExpenses } from '@/hooks/useExpenses'
import { overrideExpenseStatus } from '@/services/expenseService'
import { useAuthStore } from '@/store/authStore'

export default function AllExpenses() {
  const { expenses, fetchExpenses, filters, setFilters, isLoading } = useExpenses()
  const company = useAuthStore((state) => state.company)
  const [overrideExpense, setOverrideExpense] = useState(null)
  const [overrideDecision, setOverrideDecision] = useState(null)

  useEffect(() => {
    fetchExpenses({ filters })
  }, [fetchExpenses, filters])

  const exportCsv = () => {
    const header = `Description,Employee,Status,Amount ${company?.baseCurrency ?? 'INR'}\n`
    const rows = expenses
      .map((expense) => `${expense.description},${expense.employeeName},${expense.status},${expense.amountInBase}`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'expenses.csv'
    link.click()
  }

  const columns = [
    { header: 'Employee', cell: (row) => row.employeeName },
    { header: 'Description', cell: (row) => row.description },
    { header: 'Date', cell: (row) => formatDate(row.expenseDate) },
    {
      header: 'Amount',
      cell: (row) => (
        <div>
          <p className="money-text text-sm font-semibold text-card-foreground">
            {formatCurrency(row.amount, row.currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            ≈ {formatCurrency(row.amountInBase, company?.baseCurrency ?? row.baseCurrency ?? 'INR')}
          </p>
        </div>
      ),
    },
    { header: 'Status', cell: (row) => <ExpenseStatusBadge status={row.status} /> },
    {
      header: 'Override',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation()
            setOverrideExpense(row)
          }}
        >
          Override
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground">All Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Company-wide expense records</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search all expenses"
              value={filters.search}
              onChange={(event) => setFilters({ search: event.target.value })}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ status: value })}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={expenses} loading={isLoading} />

      <Modal
        open={Boolean(overrideExpense)}
        onOpenChange={(value) => !value && setOverrideExpense(null)}
        title="Override approval"
        description="Force approve or reject this expense as an admin."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setOverrideExpense(null)} disabled={Boolean(overrideDecision)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!overrideExpense) return
                setOverrideDecision('rejected')
                try {
                  await overrideExpenseStatus(overrideExpense.id, 'rejected', 'Rejected by admin override.')
                  setOverrideExpense(null)
                  toast.success('Expense rejected by override.')
                  await fetchExpenses({ filters })
                } finally {
                  setOverrideDecision(null)
                }
              }}
              loading={overrideDecision === 'rejected'}
              loadingText="Rejecting..."
            >
              Force Reject
            </Button>
            <Button
              onClick={async () => {
                if (!overrideExpense) return
                setOverrideDecision('approved')
                try {
                  await overrideExpenseStatus(overrideExpense.id, 'approved', 'Approved by admin override.')
                  setOverrideExpense(null)
                  toast.success('Expense approved by override.')
                  await fetchExpenses({ filters })
                } finally {
                  setOverrideDecision(null)
                }
              }}
              loading={overrideDecision === 'approved'}
              loadingText="Approving..."
            >
              Force Approve
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          This updates the current status immediately and should be used sparingly for exceptions.
        </p>
      </Modal>
    </div>
  )
}
