import { Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ApprovalActionPanel } from '@/components/features/approvals/ApprovalActionPanel'
import { ExpenseStatusBadge } from '@/components/features/expenses/ExpenseStatusBadge'
import { Card, CardContent } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useApprovals } from '@/hooks/useApprovals'

export default function ApprovalQueue() {
  const navigate = useNavigate()
  const { getApprovalQueue, decideApproval } = useApprovals()
  const [queue, setQueue] = useState([])
  const [filters, setFilters] = useState({ status: 'all', search: '' })
  const [pendingAction, setPendingAction] = useState(null)

  const loadQueue = useCallback(async () => {
    const result = await getApprovalQueue(filters)
    setQueue(result)
  }, [filters, getApprovalQueue])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const columns = [
    { header: 'Subject', cell: (row) => row.description },
    { header: 'Employee', cell: (row) => row.employee?.name ?? 'Unknown' },
    { header: 'Category', cell: (row) => <span className="capitalize">{row.category}</span> },
    { header: 'Submitted', cell: (row) => formatDate(row.createdAt) },
    {
      header: 'Amount',
      cell: (row) => (
        <div>
          <p className="money-text text-sm font-semibold text-card-foreground">
            {formatCurrency(row.amount, row.currency)}
          </p>
          <p className="text-xs text-muted-foreground">≈ {formatCurrency(row.amountInBase, 'INR')}</p>
        </div>
      ),
    },
    { header: 'Status', cell: (row) => <ExpenseStatusBadge status={row.status} /> },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-success/12 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/20"
            onClick={(event) => {
              event.stopPropagation()
              setPendingAction({ expense: row, decision: 'approved' })
            }}
          >
            Approve
          </button>
          <button
            type="button"
            className="rounded-lg bg-destructive/12 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
            onClick={(event) => {
              event.stopPropagation()
              setPendingAction({ expense: row, decision: 'rejected' })
            }}
          >
            Reject
          </button>
        </div>
      ),
    },
  ]

  const handleDecision = async (comment) => {
    if (!pendingAction) return
    const approval = pendingAction.expense.approvalChain.find((step) => step.status === 'pending')
    await decideApproval({
      expenseId: pendingAction.expense.id,
      approvalId: approval.id,
      decision: pendingAction.decision,
      comment,
    })
    toast.success(`Expense ${pendingAction.decision}.`)
    setPendingAction(null)
    loadQueue()
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl text-foreground">Approval Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and act on pending expense requests</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex gap-1.5">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, status }))}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium capitalize transition-all ${
                  filters.status === status
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-accent/50 text-muted-foreground hover:bg-accent'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by employee or description"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={queue} onRowClick={(row) => navigate(`/approvals/${row.id}`)} />

      <ApprovalActionPanel
        open={Boolean(pendingAction)}
        onOpenChange={(value) => !value && setPendingAction(null)}
        decision={pendingAction?.decision}
        onConfirm={handleDecision}
      />
    </div>
  )
}
