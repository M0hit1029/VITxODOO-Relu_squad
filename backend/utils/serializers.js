const FRONTEND_CATEGORY_BY_BACKEND = {
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
};

const BACKEND_CATEGORY_BY_FRONTEND = {
	food: 'Food',
	travel: 'Travel',
	accommodation: 'Accommodation',
	software: 'Software/Tools',
	supplies: 'Supplies',
	utilities: 'Utilities',
	misc: 'Miscellaneous',
	miscellaneous: 'Miscellaneous',
	entertainment: 'Miscellaneous',
	medical: 'Miscellaneous',
	'office supplies': 'Supplies',
};

const DEFAULT_USER_STATUS = 'active';

const toNumber = (value, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const getFrontendCategory = (category) => {
	if (!category) {
		return 'misc';
	}

	return FRONTEND_CATEGORY_BY_BACKEND[category] || FRONTEND_CATEGORY_BY_BACKEND[String(category).trim()] || 'misc';
};

const getBackendCategory = (category) => {
	if (!category) {
		return null;
	}

	const normalized = String(category).trim();
	return (
		BACKEND_CATEGORY_BY_FRONTEND[normalized] ||
		BACKEND_CATEGORY_BY_FRONTEND[normalized.toLowerCase()] ||
		normalized
	);
};

const serializeCompany = (company, extra = {}) => {
	if (!company) {
		return null;
	}

	return {
		id: company.id,
		name: company.name,
		country: company.country,
		baseCurrency: company.base_currency,
		...extra,
	};
};

const serializeUser = (user, extra = {}) => {
	if (!user) {
		return null;
	}

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		companyId: user.company_id,
		managerId: user.manager_id || user.manager?.id || null,
		status: extra.status || user.status || DEFAULT_USER_STATUS,
		createdAt: user.created_at,
		manager: user.manager
			? {
					id: user.manager.id,
					name: user.manager.name,
				}
			: null,
	};
};

const serializeExpenseLog = (log) => ({
	id: log.id,
	actorId: log.actor_id,
	actorName: log.actor_name || log.actor?.name || 'System',
	action: log.action,
	note: log.note || '',
	timestamp: log.timestamp,
});

const serializeApprovalStep = (request) => ({
	id: request.id,
	approverId: request.approver_id,
	approverName: request.approver_name || request.approver?.name || 'Unknown approver',
	role: request.approver_role || request.approver?.role || 'manager',
	status: request.status,
	comment: request.comments || '',
	createdAt: request.created_at,
	decidedAt: request.decided_at,
	isRequired: Boolean(request.is_required),
	sequenceOrder: request.sequence_order,
});

const serializeExpense = (expense, options = {}) => {
	if (!expense) {
		return null;
	}

	const employee = expense.employee
		? serializeUser(
				{
					...expense.employee,
					company_id: expense.company_id,
				},
				{ status: expense.employee.status || DEFAULT_USER_STATUS },
		  )
		: null;

	return {
		id: expense.id,
		employeeId: expense.employee_id,
		employee,
		employeeName: employee?.name || expense.employee_name || 'Unknown',
		description: expense.description,
		category: getFrontendCategory(expense.category),
		expenseDate: expense.expense_date,
		amount: toNumber(expense.amount),
		currency: expense.currency,
		amountInBase: toNumber(expense.amount_in_base, toNumber(expense.amount)),
		baseCurrency: options.baseCurrency || expense.company?.base_currency || null,
		paidBy: expense.paid_by,
		remarks: expense.remarks || '',
		receiptUrl: expense.receipt_url || '',
		status: expense.status,
		createdAt: expense.created_at,
		updatedAt: expense.updated_at,
		logs: Array.isArray(expense.expense_logs) ? expense.expense_logs.map(serializeExpenseLog) : [],
		approvalChain: Array.isArray(expense.approval_requests)
			? expense.approval_requests
					.slice()
					.sort((left, right) => left.sequence_order - right.sequence_order)
					.map(serializeApprovalStep)
			: [],
	};
};

const getRuleMode = (rule) => {
	const approvers = Array.isArray(rule.approvers) ? rule.approvers : [];

	if (rule.approvers_sequence) {
		return 'sequential';
	}

	if (rule.min_approval_percentage < 100 || approvers.some((approver) => approver.is_required)) {
		return 'hybrid';
	}

	return 'parallel';
};

const serializeRule = (rule) => {
	if (!rule) {
		return null;
	}

	return {
		id: rule.id,
		name: rule.description,
		description: rule.description,
		employeeId: rule.user_id,
		employee: rule.user
			? {
					id: rule.user_id,
					name: rule.user.name,
					email: rule.user.email,
				}
			: null,
		managerId: rule.manager_id || null,
		manager: rule.manager
			? {
					id: rule.manager_id,
					name: rule.manager.name,
				}
			: null,
		isManagerRequired: Boolean(rule.is_manager_approver),
		mode: getRuleMode(rule),
		minApprovalPercentage: rule.min_approval_percentage,
		approvers: Array.isArray(rule.approvers)
			? rule.approvers.map((approver) => ({
					id: approver.id,
					userId: approver.user_id,
					sequenceOrder: approver.sequence_order,
					isRequired: Boolean(approver.is_required),
					name: approver.user?.name || 'Unknown approver',
					user: approver.user
						? {
								id: approver.user_id,
								name: approver.user.name,
								email: approver.user.email || '',
							}
						: null,
				}))
			: [],
		createdAt: rule.created_at,
	};
};

const serializeApprovalQueueItem = (request) => {
	const expense = request.expense;
	const employee = expense?.employee
		? {
				id: expense.employee.id || expense.employee_id,
				name: expense.employee.name,
				email: expense.employee.email || '',
			}
		: null;

	return {
		id: expense.id,
		approvalRequestId: request.id,
		description: expense.description,
		category: getFrontendCategory(expense.category),
		employeeId: expense.employee_id,
		employee,
		employeeName: employee?.name || 'Unknown',
		status: request.status,
		expenseStatus: expense.status,
		createdAt: expense.created_at,
		submittedAt: expense.created_at,
		decidedAt: request.decided_at,
		amount: toNumber(expense.amount),
		currency: expense.currency,
		amountInBase: toNumber(expense.amount_in_base, toNumber(expense.amount)),
		baseCurrency: expense.company?.base_currency || null,
	};
};

module.exports = {
	getBackendCategory,
	getFrontendCategory,
	serializeApprovalQueueItem,
	serializeCompany,
	serializeExpense,
	serializeRule,
	serializeUser,
};
