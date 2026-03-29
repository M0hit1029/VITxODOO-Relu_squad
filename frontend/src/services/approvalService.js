import { api, withApiFallback } from '@/services/api'
import { nextId, readDb, updateDb } from '@/services/mockDb'
import { sleep } from '@/lib/utils'
import { normalizeQueueItem, normalizeRule } from '@/services/normalizers'

function isActionable(expense, approverId) {
  const index = expense.approvalChain?.findIndex(
    (step) => step.approverId === approverId && step.status === 'pending',
  )
  if (index == null || index < 0) return false
  if (expense.approvalMode !== 'sequential') return true
  return expense.approvalChain.slice(0, index).every((step) => step.status === 'approved')
}

function decorateQueue(expenses, users) {
  return expenses.map((expense) => ({
    ...expense,
    employee: users.find((user) => user.id === expense.employeeId),
  }))
}

async function mockQueue(user, filters = {}) {
  await sleep(400)
  const db = readDb()
  const actionable = db.expenses.filter((expense) => {
    if (!expense.approvalChain?.length) return false
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'pending' && expense.status !== 'submitted') return false
      if (filters.status !== 'pending' && expense.status !== filters.status) return false
    }
    if (filters.search) {
      const employee = db.users.find((entry) => entry.id === expense.employeeId)
      const searchString = `${expense.description} ${employee?.name ?? ''}`.toLowerCase()
      if (!searchString.includes(filters.search.toLowerCase())) return false
    }
    return isActionable(expense, user.id)
  })
  return decorateQueue(actionable, db.users).sort(
    (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt),
  )
}

async function mockDecision({ expenseId, approvalId, decision, comment, actor }) {
  await sleep(650)
  const resolvedDecision = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : decision
  const updated = updateDb((db) => {
    const expense = db.expenses.find((entry) => entry.id === expenseId)
    if (!expense) return
    const approval = expense.approvalChain.find((entry) => entry.id === approvalId)
    if (!approval) return

    approval.status = resolvedDecision
    approval.comment = comment
    approval.decidedAt = new Date().toISOString()

    expense.logs.push({
      id: nextId('log'),
      actorId: actor.id,
      actorName: actor.name,
      action: resolvedDecision,
      timestamp: new Date().toISOString(),
      note: comment,
    })

    if (resolvedDecision === 'rejected') {
      expense.status = 'rejected'
      expense.updatedAt = new Date().toISOString()
      return
    }

    const allApproved = expense.approvalChain.every((entry) => entry.status === 'approved')
    if (allApproved) {
      expense.status = 'approved'
      expense.updatedAt = new Date().toISOString()
    }
  })
  return updated.expenses.find((expense) => expense.id === expenseId) ?? null
}

async function mockRules() {
  await sleep(320)
  const db = readDb()
  return db.rules.map((rule) => ({
    ...rule,
    employee: db.users.find((user) => user.id === rule.employeeId),
    approverUsers: rule.approvers.map((approver) => db.users.find((user) => user.id === approver.userId)),
  }))
}

async function mockSaveRule(payload) {
  await sleep(520)
  const updated = updateDb((db) => {
    const nextRule = {
      ...payload,
      id: payload.id ?? nextId('rule'),
    }
    const index = db.rules.findIndex((rule) => rule.id === nextRule.id)
    if (index >= 0) db.rules[index] = nextRule
    else db.rules.unshift(nextRule)
  })
  return updated.rules[0]
}

async function mockDeleteRule(ruleId) {
  await sleep(320)
  updateDb((db) => {
    db.rules = db.rules.filter((rule) => rule.id !== ruleId)
  })
  return { success: true }
}

function filterQueue(queue, filters = {}) {
  return queue.filter((item) => {
    if (filters.status && filters.status !== 'all' && item.status !== filters.status) return false
    if (filters.search) {
      const haystack = `${item.description} ${item.employeeName}`.toLowerCase()
      if (!haystack.includes(filters.search.toLowerCase())) return false
    }
    return true
  })
}

function toRulePayload(payload) {
  return {
    description: payload.description,
    employeeId: payload.employeeId,
    managerId: payload.managerId || null,
    isManagerRequired: payload.isManagerRequired,
    mode: payload.mode,
    minApprovalPercentage: payload.minApprovalPercentage,
    approvers: payload.approvers.map((approver, index) => ({
      userId: approver.userId,
      sequenceOrder: approver.sequenceOrder ?? index + 1,
      isRequired: approver.isRequired,
    })),
  }
}

export async function getApprovalQueue(user, filters) {
  return withApiFallback(
    async () => {
      const response = await api.get('/api/approvals/pending')
      return filterQueue(response.data.map(normalizeQueueItem), filters)
    },
    () => mockQueue(user, filters),
  )
}

export async function decideApproval(payload) {
  return withApiFallback(
    async () => {
      const response = await api.post(`/api/approvals/${payload.approvalId}/${payload.decision}`, {
        comment: payload.comment,
      })
      return response.data
    },
    () => mockDecision(payload),
  )
}

export async function getApprovalRules() {
  return withApiFallback(
    async () => {
      const response = await api.get('/api/rules')
      return response.data.map(normalizeRule)
    },
    () => mockRules(),
  )
}

export async function saveApprovalRule(payload) {
  return withApiFallback(
    async () => {
      const response = payload.id
        ? await api.put(`/api/rules/${payload.id}`, toRulePayload(payload))
        : await api.post('/api/rules', toRulePayload(payload))
      return normalizeRule(response.data)
    },
    () => mockSaveRule(payload),
  )
}

export async function deleteApprovalRule(ruleId) {
  return withApiFallback(
    async () => {
      const response = await api.delete(`/api/rules/${ruleId}`)
      return response.data
    },
    () => mockDeleteRule(ruleId),
  )
}
