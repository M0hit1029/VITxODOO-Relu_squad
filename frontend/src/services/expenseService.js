import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { api, withApiFallback } from '@/services/api'
import { CATEGORIES } from '@/lib/constants'
import { nextId, readDb, updateDb } from '@/services/mockDb'
import { sleep } from '@/lib/utils'

function getEmployee(expense, users) {
  return users.find((user) => user.id === expense.employeeId)
}

function matchesRole(expense, user) {
  if (!user) return false
  if (user.role === 'admin') return true
  if (user.role === 'manager') {
    return expense.employeeId === user.id || expense.approvalChain?.some((step) => step.approverId === user.id)
  }
  return expense.employeeId === user.id
}

function matchesFilters(expense, filters) {
  if (filters.status && filters.status !== 'all' && expense.status !== filters.status) return false
  if (filters.category && filters.category !== 'all' && expense.category !== filters.category) return false
  if (filters.categories?.length && !filters.categories.includes(expense.category)) return false

  if (filters.search) {
    const haystack = `${expense.description} ${expense.remarks ?? ''}`.toLowerCase()
    if (!haystack.includes(filters.search.toLowerCase())) return false
  }

  if (filters.employeeId && filters.employeeId !== 'all' && expense.employeeId !== filters.employeeId) {
    return false
  }

  if (filters.dateRange?.from || filters.dateRange?.to) {
    const date = parseISO(expense.expenseDate)
    if (filters.dateRange.from && isBefore(date, parseISO(filters.dateRange.from))) return false
    if (filters.dateRange.to && isAfter(date, parseISO(filters.dateRange.to))) return false
  }

  return true
}

function decorateExpenses(expenses, users) {
  return expenses.map((expense) => {
    const employee = getEmployee(expense, users)
    return {
      ...expense,
      employee,
      employeeName: employee?.name ?? 'Unknown',
    }
  })
}

function paginate(items, page = 1, limit = 10) {
  const start = (page - 1) * limit
  return items.slice(start, start + limit)
}

function buildApprovalChain(db, employeeId) {
  const employee = db.users.find((user) => user.id === employeeId)
  const directManager = employee?.managerId
    ? db.users.find((user) => user.id === employee.managerId)
    : null
  const rule = db.rules.find((entry) => entry.employeeId === employeeId)
  const chain = []

  if (rule?.isManagerRequired && directManager) {
    chain.push({
      id: nextId('approval'),
      approverId: directManager.id,
      approverName: directManager.name,
      role: directManager.role,
      status: 'pending',
      comment: '',
      createdAt: new Date().toISOString(),
      decidedAt: null,
      isRequired: true,
    })
  }

  ;(rule?.approvers ?? []).forEach((approver) => {
    const user = db.users.find((entry) => entry.id === approver.userId)
    if (!user) return
    chain.push({
      id: nextId('approval'),
      approverId: user.id,
      approverName: user.name,
      role: user.role,
      status: 'pending',
      comment: '',
      createdAt: new Date().toISOString(),
      decidedAt: null,
      isRequired: Boolean(approver.isRequired),
    })
  })

  return {
    approvalMode: rule?.mode ?? 'sequential',
    approvalChain: chain,
  }
}

async function mockListExpenses({ user, filters = {}, page = 1, limit = 10 }) {
  await sleep(450)
  const db = readDb()
  const decorated = decorateExpenses(
    db.expenses.filter((expense) => matchesRole(expense, user) && matchesFilters(expense, filters)),
    db.users,
  ).sort((left, right) => new Date(right.expenseDate) - new Date(left.expenseDate))

  return {
    data: paginate(decorated, page, limit),
    total: decorated.length,
  }
}

async function mockGetExpenseById(expenseId) {
  await sleep(250)
  const db = readDb()
  return decorateExpenses(db.expenses.filter((expense) => expense.id === expenseId), db.users)[0] ?? null
}

async function mockSaveExpense(payload, user) {
  await sleep(700)
  let createdId = payload.id

  const updated = updateDb((db) => {
    if (payload.id) {
      const index = db.expenses.findIndex((expense) => expense.id === payload.id)
      if (index >= 0) {
        db.expenses[index] = {
          ...db.expenses[index],
          ...payload,
          updatedAt: new Date().toISOString(),
        }
      }
      return
    }

    db.expenses.unshift({
      id: nextId('expense'),
      employeeId: user.id,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvalMode: 'sequential',
      approvalChain: [],
      logs: [
        {
          id: nextId('log'),
          actorId: user.id,
          actorName: user.name,
          action: 'created',
          timestamp: new Date().toISOString(),
          note: 'Saved as draft',
        },
      ],
      ...payload,
      amountInBase: payload.amountInBase ?? payload.amount,
    })
    createdId = db.expenses[0].id
  })

  return decorateExpenses(updated.expenses.filter((expense) => expense.id === createdId), updated.users)[0]
}

async function mockSubmitExpense(expenseId, actor) {
  await sleep(900)

  const updated = updateDb((db) => {
    const expense = db.expenses.find((entry) => entry.id === expenseId)
    if (!expense) return

    const approvalState = buildApprovalChain(db, expense.employeeId)
    expense.status = 'submitted'
    expense.updatedAt = new Date().toISOString()
    expense.approvalMode = approvalState.approvalMode
    expense.approvalChain = approvalState.approvalChain
    expense.logs.push({
      id: nextId('log'),
      actorId: actor.id,
      actorName: actor.name,
      action: 'submitted',
      timestamp: new Date().toISOString(),
      note: 'Submitted for approval',
    })
  })

  return decorateExpenses(updated.expenses.filter((expense) => expense.id === expenseId), updated.users)[0]
}

async function mockGetEmployeeDashboard(user) {
  await sleep(300)
  const db = readDb()
  const expenses = db.expenses.filter((expense) => expense.employeeId === user.id)
  const currentMonthStart = startOfMonth(new Date())
  const totalSubmitted = expenses
    .filter((expense) => new Date(expense.expenseDate) >= currentMonthStart)
    .reduce((sum, expense) => sum + Number(expense.amountInBase), 0)
  const pendingCount = expenses.filter((expense) => expense.status === 'submitted').length
  const approvedThisMonth = expenses
    .filter((expense) => expense.status === 'approved' && new Date(expense.expenseDate) >= currentMonthStart)
    .reduce((sum, expense) => sum + Number(expense.amountInBase), 0)
  const rejectedCount = expenses.filter((expense) => expense.status === 'rejected').length

  const interval = {
    start: startOfMonth(subMonths(new Date(), 5)),
    end: endOfMonth(new Date()),
  }

  const spendingByMonth = eachMonthOfInterval(interval).map((month) => {
    const monthKey = format(month, 'yyyy-MM')
    const monthTotal = expenses
      .filter((expense) => format(parseISO(expense.expenseDate), 'yyyy-MM') === monthKey)
      .reduce((sum, expense) => sum + Number(expense.amountInBase), 0)
    return { month: format(month, 'MMM'), amount: monthTotal }
  })

  const categoryBreakdown = CATEGORIES.map((category) => ({
    name: category.label,
    value: expenses
      .filter((expense) => expense.category === category.value)
      .reduce((sum, expense) => sum + Number(expense.amountInBase), 0),
  })).filter((entry) => entry.value > 0)

  return {
    stats: [
      { label: 'Total Submitted', value: totalSubmitted, kind: 'currency' },
      { label: 'Pending Approval', value: pendingCount, kind: 'count' },
      { label: 'Approved This Month', value: approvedThisMonth, kind: 'currency' },
      { label: 'Rejected', value: rejectedCount, kind: 'count' },
    ],
    spendingByMonth,
    categoryBreakdown,
    recentExpenses: decorateExpenses(expenses, db.users)
      .sort((left, right) => new Date(right.expenseDate) - new Date(left.expenseDate))
      .slice(0, 5),
  }
}

async function mockGetAdminDashboard() {
  await sleep(300)
  const db = readDb()
  const totalCompanySpend = db.expenses.reduce((sum, expense) => sum + Number(expense.amountInBase), 0)
  const pending = db.expenses.filter((expense) => expense.status === 'submitted')
  const approved = db.expenses.filter((expense) => expense.status === 'approved')
  return {
    stats: [
      { label: 'Company Spend', value: totalCompanySpend, kind: 'currency' },
      { label: 'Pending Reviews', value: pending.length, kind: 'count' },
      { label: 'Approved Expenses', value: approved.length, kind: 'count' },
      { label: 'Team Members', value: db.users.length, kind: 'count' },
    ],
    recentExpenses: decorateExpenses(db.expenses, db.users)
      .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
      .slice(0, 6),
  }
}

async function mockGetManagerDashboard(user) {
  await sleep(300)
  const db = readDb()
  const expenses = db.expenses.filter((expense) =>
    expense.approvalChain?.some((step) => step.approverId === user.id),
  )

  const pending = expenses.filter((expense) => expense.status === 'submitted')
  const approved = expenses.filter((expense) => expense.status === 'approved')
  const rejected = expenses.filter((expense) => expense.status === 'rejected')

  const stats = [
    { label: 'Pending My Approval', value: pending.length, kind: 'count' },
    { label: 'Approved This Month', value: approved.length, kind: 'count', color: 'success' },
    { label: 'Rejected This Month', value: rejected.length, kind: 'count', color: 'destructive' },
    {
      label: 'Total Value Pending',
      value: pending.reduce((sum, expense) => sum + Number(expense.amountInBase), 0),
      kind: 'currency',
    },
  ]

  const totals = new Map()
  expenses.forEach((expense) => {
    const current = totals.get(expense.employeeId) ?? 0
    totals.set(expense.employeeId, current + Number(expense.amountInBase))
  })
  const teamChart = [...totals.entries()].map(([employeeId, amount]) => {
    const employee = db.users.find((u) => u.id === employeeId)
    return { month: employee?.name?.split(' ')[0] ?? employeeId, amount }
  })

  const pendingApprovals = decorateExpenses(pending, db.users)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 5)

  return { stats, teamChart, pendingApprovals }
}

export async function listExpenses(params) {
  return withApiFallback(
    async () => {
      const response = await api.get('/api/expenses', { params })
      return response.data
    },
    () => mockListExpenses(params),
  )
}

export async function getExpenseById(expenseId) {
  return withApiFallback(
    async () => {
      const response = await api.get(`/api/expenses/${expenseId}`)
      return response.data
    },
    () => mockGetExpenseById(expenseId),
  )
}

export async function saveExpense(payload, user) {
  return withApiFallback(
    async () => {
      const response = payload.id
        ? await api.put(`/api/expenses/${payload.id}`, payload)
        : await api.post('/api/expenses', payload)
      return response.data
    },
    () => mockSaveExpense(payload, user),
  )
}

export async function submitExpense(expenseId, actor) {
  return withApiFallback(
    async () => {
      const response = await api.post(`/api/expenses/${expenseId}/submit`)
      return response.data
    },
    () => mockSubmitExpense(expenseId, actor),
  )
}

export async function getEmployeeDashboard(user) {
  return mockGetEmployeeDashboard(user)
}

export async function getAdminDashboard() {
  return mockGetAdminDashboard()
}

export async function getManagerDashboard(user) {
  return mockGetManagerDashboard(user)
}

