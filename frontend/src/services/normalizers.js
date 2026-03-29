const frontendCategoryByBackend = {
  Food: 'food',
  Travel: 'travel',
  Accommodation: 'accommodation',
  'Software/Tools': 'software',
  Supplies: 'supplies',
  Utilities: 'utilities',
  Miscellaneous: 'misc',
  Entertainment: 'misc',
  Medical: 'misc',
  'Office Supplies': 'supplies',
}

const backendCategoryByFrontend = {
  food: 'Food',
  travel: 'Travel',
  accommodation: 'Accommodation',
  software: 'Software/Tools',
  supplies: 'Supplies',
  utilities: 'Utilities',
  misc: 'Miscellaneous',
}

export function normalizeCompany(company) {
  if (!company) return null

  return {
    id: company.id,
    name: company.name,
    country: company.country,
    baseCurrency: company.baseCurrency ?? company.base_currency ?? 'INR',
    notifications: company.notifications ?? {
      submission: true,
      approval: true,
      rejection: true,
    },
    security: company.security ?? {
      minLength: 8,
      requireMfa: false,
    },
    logoUrl: company.logoUrl ?? '',
  }
}

export function normalizeUser(user) {
  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    managerId: user.managerId ?? user.manager_id ?? user.manager?.id ?? null,
    manager: user.manager
      ? {
          id: user.manager.id,
          name: user.manager.name,
        }
      : null,
    status: user.status ?? 'active',
    createdAt: user.createdAt ?? user.created_at ?? null,
  }
}

export function toFrontendCategory(category) {
  if (!category) return 'misc'
  return frontendCategoryByBackend[category] ?? frontendCategoryByBackend[String(category).trim()] ?? 'misc'
}

export function toBackendCategory(category) {
  if (!category) return ''
  return backendCategoryByFrontend[category] ?? category
}

function normalizeLog(log) {
  return {
    id: log.id,
    actorId: log.actorId ?? log.actor_id,
    actorName: log.actorName ?? log.actor?.name ?? 'System',
    action: log.action,
    note: log.note ?? '',
    timestamp: log.timestamp,
  }
}

function normalizeApprovalStep(step) {
  return {
    id: step.id,
    approverId: step.approverId ?? step.approver_id ?? step.approver?.id,
    approverName: step.approverName ?? step.approver?.name ?? 'Unknown approver',
    role: step.role ?? step.approver?.role ?? 'manager',
    status: step.status,
    comment: step.comment ?? step.comments ?? '',
    createdAt: step.createdAt ?? step.created_at ?? null,
    decidedAt: step.decidedAt ?? step.decided_at ?? null,
    isRequired: Boolean(step.isRequired ?? step.is_required),
    sequenceOrder: step.sequenceOrder ?? step.sequence_order ?? 0,
  }
}

export function normalizeExpense(expense) {
  if (!expense) return null

  const employee = normalizeUser(expense.employee)

  return {
    id: expense.id,
    employeeId: expense.employeeId ?? expense.employee_id ?? employee?.id ?? null,
    employee,
    employeeName: expense.employeeName ?? expense.employee_name ?? employee?.name ?? 'Unknown',
    description: expense.description,
    category: toFrontendCategory(expense.category),
    expenseDate: expense.expenseDate ?? expense.expense_date,
    amount: Number(expense.amount ?? 0),
    currency: expense.currency,
    amountInBase: Number(expense.amountInBase ?? expense.amount_in_base ?? expense.amount ?? 0),
    baseCurrency: expense.baseCurrency ?? expense.company?.baseCurrency ?? expense.company?.base_currency ?? 'INR',
    paidBy: expense.paidBy ?? expense.paid_by ?? 'Self',
    remarks: expense.remarks ?? '',
    receiptUrl: expense.receiptUrl ?? expense.receipt_url ?? '',
    status: expense.status,
    createdAt: expense.createdAt ?? expense.created_at,
    updatedAt: expense.updatedAt ?? expense.updated_at,
    logs: (expense.logs ?? expense.expense_logs ?? []).map(normalizeLog),
    approvalChain: (expense.approvalChain ?? expense.approval_requests ?? []).map(normalizeApprovalStep),
  }
}

export function normalizeQueueItem(item) {
  if (!item) return null

  return {
    id: item.id,
    approvalRequestId: item.approvalRequestId ?? item.approval_request_id,
    description: item.description,
    category: toFrontendCategory(item.category),
    employeeId: item.employeeId ?? item.employee_id ?? item.employee?.id,
    employee: normalizeUser(item.employee) ?? item.employee,
    employeeName: item.employeeName ?? item.employee?.name ?? 'Unknown',
    status: item.status,
    expenseStatus: item.expenseStatus ?? item.expense_status ?? 'submitted',
    createdAt: item.createdAt ?? item.created_at,
    submittedAt: item.submittedAt ?? item.submitted_at ?? item.createdAt ?? item.created_at,
    decidedAt: item.decidedAt ?? item.decided_at ?? null,
    amount: Number(item.amount ?? 0),
    currency: item.currency,
    amountInBase: Number(item.amountInBase ?? item.amount_in_base ?? item.amount ?? 0),
    baseCurrency: item.baseCurrency ?? item.base_currency ?? 'INR',
  }
}

export function normalizeRule(rule) {
  if (!rule) return null

  return {
    id: rule.id,
    name: rule.name ?? rule.description ?? 'Approval Rule',
    description: rule.description ?? rule.name ?? '',
    employeeId: rule.employeeId ?? rule.user_id ?? rule.user?.id ?? '',
    employee: normalizeUser(rule.employee ?? rule.user),
    managerId: rule.managerId ?? rule.manager_id ?? rule.manager?.id ?? null,
    manager: normalizeUser(rule.manager),
    isManagerRequired: Boolean(rule.isManagerRequired ?? rule.is_manager_approver),
    mode:
      rule.mode ??
      (rule.approvers_sequence ? 'sequential' : Number(rule.minApprovalPercentage ?? rule.min_approval_percentage ?? 100) < 100 ? 'hybrid' : 'parallel'),
    minApprovalPercentage: Number(rule.minApprovalPercentage ?? rule.min_approval_percentage ?? 100),
    approvers: (rule.approvers ?? []).map((approver, index) => ({
      id: approver.id,
      userId: approver.userId ?? approver.user_id,
      sequenceOrder: approver.sequenceOrder ?? approver.sequence_order ?? index + 1,
      isRequired: Boolean(approver.isRequired ?? approver.is_required),
      name: approver.name ?? approver.user?.name ?? 'Unknown approver',
      user: normalizeUser(approver.user),
    })),
    createdAt: rule.createdAt ?? rule.created_at ?? null,
  }
}
