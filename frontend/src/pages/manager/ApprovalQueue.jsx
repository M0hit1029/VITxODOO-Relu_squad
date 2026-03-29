import { Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ApprovalActionPanel } from '@/components/features/approvals/ApprovalActionPanel'
import { ExpenseStatusBadge } from '@/components/features/expenses/ExpenseStatusBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useApprovals } from '@/hooks/useApprovals'
import { useAuthStore } from '@/store/authStore'

export default function ApprovalQueue() {
  const navigate = useNavigate()
  const company = useAuthStore((state) => state.company)
  const { getApprovalQueue, decideApproval } = useApprovals()
  const [queue, setQueue] = useState([])
  const [filters, setFilters] = useState({ status: 'all', search: '' })
  const [pendingAction, setPendingAction] = useState(null)
  const [isLoadingQueue, setIsLoadingQueue] = useState(true)

  const loadQueue = useCallback(async () => {
    setIsLoadingQueue(true)
    try {
      const result = await getApprovalQueue(filters)
      setQueue(result)
    } catch (error) {
      toast.error(error.message || 'Unable to load approval queue.')
    } finally {
      setIsLoadingQueue(false)
    }
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
          <p className="text-xs text-muted-foreground">
            ≈ {formatCurrency(row.amountInBase, company?.baseCurrency ?? row.baseCurrency ?? 'INR')}
          </p>
        </div>
      ),
    },
    { header: 'Status', cell: (row) => <ExpenseStatusBadge status={row.status} /> },
    {
      header: 'Actions',
      cell: (row) =>
        row.status === 'pending' ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="bg-success/12 text-success hover:bg-success/20 hover:text-success"
              onClick={(event) => {
                event.stopPropagation()
                setPendingAction({ expense: row, decision: 'approve' })
              }}
            >
              Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-destructive/12 text-destructive hover:bg-destructive/20 hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation()
                setPendingAction({ expense: row, decision: 'reject' })
              }}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Completed</span>
        ),
    },
  ]

  const handleDecision = async (comment) => {
    if (!pendingAction) return
    await decideApproval({
      expenseId: pendingAction.expense.id,
      approvalId: pendingAction.expense.approvalRequestId,
      decision: pendingAction.decision,
      comment,
    })
    toast.success(`Expense ${pendingAction.decision === 'approve' ? 'approved' : 'rejected'}.`)
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

      <DataTable
        columns={columns}
        data={queue}
        loading={isLoadingQueue}
        onRowClick={(row) => navigate(`/approvals/${row.id}`)}
      />

      <ApprovalActionPanel
        open={Boolean(pendingAction)}
        onOpenChange={(value) => !value && setPendingAction(null)}
        decision={pendingAction?.decision}
        onConfirm={handleDecision}
      />
    </div>
  )
}
