const prisma = require('../dbs/db');

const createEngineError = (code, message) => {
	const error = new Error(message);
	error.code = code;
	return error;
};

const createApprovalRequest = async (expenseId, ruleId, approver) => {
	const existingRequest = await prisma.approvalRequest.findFirst({
		where: {
			expense_id: expenseId,
			approver_id: approver.user_id,
			sequence_order: approver.sequence_order,
		},
	});

	if (existingRequest) {
		return existingRequest;
	}

	return prisma.approvalRequest.create({
		data: {
			expense_id: expenseId,
			approver_id: approver.user_id,
			rule_id: ruleId,
			status: 'pending',
			sequence_order: approver.sequence_order,
			is_required: approver.is_required,
		},
	});
};

const getSystemActorId = async (companyId, fallbackActorId) => {
	const adminUser = await prisma.user.findFirst({
		where: {
			role: 'admin',
			company_id: companyId,
		},
		select: {
			id: true,
		},
	});

	return adminUser?.id || fallbackActorId;
};

const updateExpenseStatus = async (
	expenseId,
	status,
	companyId,
	fallbackActorId,
	note = 'System auto-resolved',
) => {
	await prisma.expense.update({
		where: { id: expenseId },
		data: { status },
	});

	await prisma.approvalRequest.updateMany({
		where: {
			expense_id: expenseId,
			status: 'pending',
		},
		data: {
			status,
			comments: note,
			decided_at: new Date(),
		},
	});

	const actorId = await getSystemActorId(companyId, fallbackActorId);

	if (actorId) {
		await prisma.expenseLog.create({
			data: {
				expense_id: expenseId,
				actor_id: actorId,
				action: status,
				note,
			},
		});
	}
};

const normalizeQueue = (queue, employeeId) => {
	const seenApprovers = new Set();

	return queue
		.filter((approver) => approver?.user_id && approver.user_id !== employeeId)
		.sort((left, right) => left.sequence_order - right.sequence_order)
		.reduce((result, approver, index) => {
			if (seenApprovers.has(approver.user_id)) {
				return result;
			}

			seenApprovers.add(approver.user_id);
			result.push({
				user_id: approver.user_id,
				sequence_order: approver.sequence_order ?? index,
				is_required: Boolean(approver.is_required),
			});
			return result;
		}, []);
};

const buildApproverQueue = (rule, expense) => {
	const queue = [];

	if (rule.is_manager_approver) {
		const managerUserId = rule.manager_id || expense.employee.manager_id;
		if (managerUserId) {
			queue.push({
				user_id: managerUserId,
				sequence_order: 0,
				is_required: true,
			});
		}
	}

	for (const approver of rule.approvers) {
		queue.push({
			user_id: approver.user_id,
			sequence_order: approver.sequence_order,
			is_required: approver.is_required,
		});
	}

	return normalizeQueue(queue, expense.employee_id);
};

const getRuleForExpense = async (expense) => {
	return prisma.approvalRule.findFirst({
		where: {
			company_id: expense.company_id,
			user_id: expense.employee_id,
		},
		include: {
			approvers: {
				orderBy: {
					sequence_order: 'asc',
				},
			},
		},
		orderBy: {
			created_at: 'desc',
		},
	});
};

const prepareApprovalFlow = async (expenseId) => {
	const expense = await prisma.expense.findUnique({
		where: { id: expenseId },
		include: {
			employee: {
				select: {
					id: true,
					manager_id: true,
				},
			},
		},
	});

	if (!expense) {
		throw createEngineError('EXPENSE_NOT_FOUND', 'Expense not found.');
	}

	const rule = await getRuleForExpense(expense);

	if (!rule) {
		throw createEngineError(
			'NO_APPROVAL_ROUTE',
			'No approval rule exists for this employee. Ask an admin to configure one before submitting.',
		);
	}

	if (rule.is_manager_approver && !rule.manager_id && !expense.employee.manager_id) {
		throw createEngineError(
			'MANAGER_REQUIRED_MISSING',
			'This approval rule requires a manager, but no manager is assigned.',
		);
	}

	return {
		expense,
		rule,
		approverQueue: buildApproverQueue(rule, expense),
	};
};

const triggerApprovalFlow = async (expenseId, preparedFlow = null) => {
	const flow = preparedFlow || (await prepareApprovalFlow(expenseId));
	const { expense, rule, approverQueue } = flow;

	if (!approverQueue.length) {
		await updateExpenseStatus(
			expense.id,
			'approved',
			expense.company_id,
			expense.employee_id,
			'Auto-approved: no eligible approvers were available for this expense.',
		);
		return;
	}

	if (rule.approvers_sequence) {
		await createApprovalRequest(expense.id, rule.id, approverQueue[0]);
		return;
	}

	await Promise.all(
		approverQueue.map((approver) => createApprovalRequest(expense.id, rule.id, approver)),
	);
};

const evaluateSequentialExpense = async (expense, rule, approvalRequests) => {
	const rejectedRequest = approvalRequests.find((request) => request.status === 'rejected');
	if (rejectedRequest) {
		await updateExpenseStatus(
			expense.id,
			'rejected',
			expense.company_id,
			expense.employee_id,
			'Rejected in sequential approval flow.',
		);
		return;
	}

	const pendingRequest = approvalRequests.find((request) => request.status === 'pending');
	if (pendingRequest) {
		return;
	}

	const queue = buildApproverQueue(rule, expense);
	const nextApprover = queue.find((approver) => {
		return !approvalRequests.some(
			(request) =>
				request.approver_id === approver.user_id &&
				request.sequence_order === approver.sequence_order,
		);
	});

	if (nextApprover) {
		await createApprovalRequest(expense.id, rule.id, nextApprover);
		return;
	}

	if (approvalRequests.length === queue.length && approvalRequests.every((request) => request.status === 'approved')) {
		await updateExpenseStatus(
			expense.id,
			'approved',
			expense.company_id,
			expense.employee_id,
			'All sequential approvers approved this expense.',
		);
	}
};

const evaluateParallelExpense = async (expense, rule, approvalRequests) => {
	const requiredRejected = approvalRequests.some(
		(request) => request.is_required && request.status === 'rejected',
	);

	if (requiredRejected) {
		await updateExpenseStatus(
			expense.id,
			'rejected',
			expense.company_id,
			expense.employee_id,
			'A required approver rejected this expense.',
		);
		return;
	}

	const requiredRequests = approvalRequests.filter((request) => request.is_required);
	const allRequiredApproved = requiredRequests.every((request) => request.status === 'approved');
	const approvedRequests = approvalRequests.filter((request) => request.status === 'approved');
	const pendingRequests = approvalRequests.filter((request) => request.status === 'pending');
	const totalApprovers = approvalRequests.length;
	const approvalPercentage = totalApprovers > 0 ? (approvedRequests.length / totalApprovers) * 100 : 0;

	if (allRequiredApproved && approvalPercentage >= rule.min_approval_percentage) {
		await updateExpenseStatus(
			expense.id,
			'approved',
			expense.company_id,
			expense.employee_id,
			'Approval threshold reached for this expense.',
		);
		return;
	}

	if (pendingRequests.length === 0) {
		await updateExpenseStatus(
			expense.id,
			'rejected',
			expense.company_id,
			expense.employee_id,
			'Approval threshold was not met for this expense.',
		);
	}
};

const evaluateExpenseStatus = async (expenseId, ruleId) => {
	const expense = await prisma.expense.findUnique({
		where: { id: expenseId },
		select: {
			id: true,
			company_id: true,
			employee_id: true,
			employee: {
				select: {
					manager_id: true,
				},
			},
		},
	});

	if (!expense) {
		return;
	}

	const rule = await prisma.approvalRule.findUnique({
		where: { id: ruleId },
		include: {
			approvers: {
				orderBy: {
					sequence_order: 'asc',
				},
			},
		},
	});

	if (!rule) {
		return;
	}

	const approvalRequests = await prisma.approvalRequest.findMany({
		where: {
			expense_id: expenseId,
		},
		orderBy: {
			sequence_order: 'asc',
		},
	});

	if (!approvalRequests.length) {
		return;
	}

	if (rule.approvers_sequence) {
		await evaluateSequentialExpense(expense, rule, approvalRequests);
		return;
	}

	await evaluateParallelExpense(expense, rule, approvalRequests);
};

const handleApprovalDecision = async (approvalRequestId, decision, comment, actorId) => {
	const request = await prisma.approvalRequest.findUnique({
		where: {
			id: approvalRequestId,
		},
		include: {
			rule: true,
			expense: true,
		},
	});

	if (!request) {
		throw createEngineError('APPROVAL_NOT_FOUND', 'Approval request not found.');
	}

	if (request.status !== 'pending' || request.expense.status !== 'submitted') {
		throw createEngineError('ALREADY_DECIDED', 'Already decided');
	}

	if (!['approved', 'rejected'].includes(decision)) {
		throw createEngineError('INVALID_DECISION', 'Invalid decision');
	}

	await prisma.approvalRequest.update({
		where: {
			id: approvalRequestId,
		},
		data: {
			status: decision,
			comments: comment,
			decided_at: new Date(),
		},
	});

	await prisma.expenseLog.create({
		data: {
			expense_id: request.expense_id,
			actor_id: actorId,
			action: decision,
			note: comment,
		},
	});

	await evaluateExpenseStatus(request.expense_id, request.rule_id);
};

module.exports = {
	prepareApprovalFlow,
	triggerApprovalFlow,
	handleApprovalDecision,
};
