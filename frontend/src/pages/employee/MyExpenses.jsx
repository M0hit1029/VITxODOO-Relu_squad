import { Plus, Search } from 'lucide-react'
import { useDeferredValue, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { DatePicker } from '@/components/ui/DatePicker'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { ExpenseStatusBadge } from '@/components/features/expenses/ExpenseStatusBadge'
import { CATEGORIES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuthStore } from '@/store/authStore'

const statuses = ['all', 'draft', 'submitted', 'approved', 'rejected']

export default function MyExpenses() {
  const navigate = useNavigate()
  const company = useAuthStore((state) => state.company)
  const {
    expenses,
    filters,
    pagination,
    isLoading,
    fetchExpenses,
    setFilters,
    setPagination,
  } = useExpenses()
  const deferredSearch = useDeferredValue(filters.search)

  useEffect(() => {
    fetchExpenses({
      filters: {
        status: filters.status,
        category: filters.category,
        dateRange: filters.dateRange,
        search: deferredSearch,
      },
      page: pagination.page,
    })
  }, [deferredSearch, fetchExpenses, filters.category, filters.dateRange, filters.status, pagination.page])

  const columns = [
    {
      header: 'Description',
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-card-foreground">{row.description}</p>
          <p className="truncate text-xs text-muted-foreground">{row.remarks || 'No remarks'}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (row) => CATEGORIES.find((entry) => entry.value === row.category)?.label ?? row.category,
    },
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
    {
      header: 'Status',
      cell: (row) => <ExpenseStatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground">My Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track and manage your expense claims</p>
        </div>
        <Button asChild>
          <Link to="/expenses/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New Expense
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-4 p-4">
          {/* Status pills */}
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setPagination({ page: 1 })
                  setFilters({ status })
                }}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium capitalize transition-all ${
                  filters.status === status
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-accent/50 text-muted-foreground hover:bg-accent'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
          {/* Search + filters */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses"
                value={filters.search}
                onChange={(event) => {
                  setPagination({ page: 1 })
                  setFilters({ search: event.target.value })
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.category}
              onValueChange={(value) => {
                setPagination({ page: 1 })
                setFilters({ category: value })
              }}
              options={[
                { value: 'all', label: 'All categories' },
                ...CATEGORIES.map((category) => ({
                  value: category.value,
                  label: category.label,
                  flag: category.emoji,
                })),
              ]}
            />
            <DatePicker
              value={filters.dateRange?.from}
              onChange={(value) => {
                setPagination({ page: 1 })
                setFilters({ dateRange: { ...filters.dateRange, from: value } })
              }}
              placeholder="From date"
            />
            <DatePicker
              value={filters.dateRange?.to}
              onChange={(value) => {
                setPagination({ page: 1 })
                setFilters({ dateRange: { ...filters.dateRange, to: value } })
              }}
              placeholder="To date"
            />
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={expenses}
        loading={isLoading}
        onRowClick={(row) => navigate(`/expenses/${row.id}`)}
        emptyState={
          <EmptyState
            title="No expenses yet. Submit your first one!"
            description="Drafts, submitted claims, and approval history will all appear here."
            action={{
              label: 'Create Expense',
              onClick: () => navigate('/expenses/new'),
            }}
          />
        }
      />

      {pagination.total > pagination.limit && (
        <Card>
          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            onPageChange={(page) => setPagination({ page })}
          />
        </Card>
      )}
    </div>
  )
}
