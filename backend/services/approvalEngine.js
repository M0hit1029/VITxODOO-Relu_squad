const prisma = require('../dbs/db');
const logger = require('../utils/logger');

const createApprovalRequest = async (expenseId, ruleId, approver) => {
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

const updateExpenseStatus = async (expenseId, status, companyId, fallbackActorId) => {
	await prisma.expense.update({
		where: { id: expenseId },
		data: { status },
	});

	const actorId = await getSystemActorId(companyId, fallbackActorId);

	if (actorId) {
		logger.info(`Auto-resolving expense ${expenseId} status to ${status} by system actor ${actorId}`);
		await prisma.expenseLog.create({
			data: {
				expense_id: expenseId,
				actor_id: actorId,
				action: status,
				note: 'System auto-resolved',
			},
		});
	}
};

const buildApproverQueue = (rule, expense) => {
	const queue = [];
	let managerPrepended = false;

	if (rule.is_manager_approver) {
		const managerUserId = rule.manager_id || expense.employee.manager_id;
		if (managerUserId) {
			queue.push({
				user_id: managerUserId,
				sequence_order: 0,
				is_required: true,
			});
			managerPrepended = true;
		}
	}

	const sortedRuleApprovers = [...rule.approvers].sort(
		(a, b) => a.sequence_order - b.sequence_order
	);

	for (const approver of sortedRuleApprovers) {
		queue.push({
			user_id: approver.user_id,
			sequence_order: managerPrepended ? approver.sequence_order + 1 : approver.sequence_order,
			is_required: approver.is_required,
		});
	}

	return queue;
};

const triggerApprovalFlow = async (expenseId) => {
	const expense = await prisma.expense.findUnique({
		where: { id: expenseId },
		include: {
			employee: {
				select: {
					id: true,
					manager_id: true,
				},
			},
			company: {
				select: {
					id: true,
				},
			},
		},
	});

	if (!expense) {
		return;
	}

	const rule = await prisma.approvalRule.findFirst({
		where: {
			user_id: expense.employee_id,
		},
		include: {
			approvers: {
				orderBy: {
					sequence_order: 'asc',
				},
			},
			manager: {
				select: {
					id: true,
				},
			},
		},
	});

	if (!rule) {
		logger.info(`Approval engine: No rule found for employee ${expense.employee_id}, falling back to draft for expense ${expense.id}`);
		await prisma.expense.update({
			where: { id: expense.id },
			data: { status: 'draft' },
		});

		await prisma.expenseLog.create({
			data: {
				expense_id: expense.id,
				actor_id: expense.employee_id,
				action: 'no_rule',
				note: 'Submission paused: no approval rule configured for this employee. Contact your admin.',
			},
		});

		return;
	}

	const approverQueue = buildApproverQueue(rule, expense).filter(
		(approver) => approver.user_id !== expense.employee_id
	);

	if (rule.is_manager_approver && !rule.manager_id && !expense.employee.manager_id) {
		await prisma.expenseLog.create({
			data: {
				expense_id: expense.id,
				actor_id: expense.employee_id,
				action: 'warning',
				note: 'Manager approver step skipped: no manager configured.',
			},
		});
	}

	if (approverQueue.length === 0) {
		await prisma.expense.update({
			where: { id: expense.id },
			data: { status: 'approved' },
		});

		const actorId = await getSystemActorId(expense.company_id, expense.employee_id);

		if (actorId) {
			logger.info(`Approval engine: Auto-approved expense ${expense.id} since no approvers were left in the queue.`);
			await prisma.expenseLog.create({
				data: {
					expense_id: expense.id,
					actor_id: actorId,
					action: 'approved',
					note: 'Auto-approved: no eligible approvers.',
				},
			});
		}

		return;
	}

	if (rule.approvers_sequence) {
		logger.info(`Approval engine: Sequential approval active. Creating request for first approver in queue for expense ${expense.id}`);
		await createApprovalRequest(expense.id, rule.id, approverQueue[0]);
		return;
	}

	logger.info(`Approval engine: Parallel approval active. Creating all parallel requests for expense ${expense.id}`);
	await Promise.all(
		approverQueue.map((approver) => createApprovalRequest(expense.id, rule.id, approver))
	);
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
	});

	const pendingRequests = approvalRequests.filter((request) => request.status === 'pending');
	const approvedRequests = approvalRequests.filter((request) => request.status === 'approved');
	const rejectedRequests = approvalRequests.filter((request) => request.status === 'rejected');

	if (rule.approvers_sequence) {
		const requiredRejectedInSequential = rejectedRequests.some((request) => request.is_required);
		if (requiredRejectedInSequential) {
			await updateExpenseStatus(expenseId, 'rejected', expense.company_id, expense.employee_id);
			return;
		}

		if (pendingRequests.length === 0) {
			const queue = buildApproverQueue(rule, expense).filter(
				(approver) => approver.user_id !== expense.employee_id
			);

			const highestSequence = approvalRequests.reduce(
				(max, request) => (request.sequence_order > max ? request.sequence_order : max),
				-1
			);

			const nextApprover = queue.find((approver) => {
				if (approver.sequence_order <= highestSequence) {
					return false;
				}

				const alreadyCreated = approvalRequests.some(
					(request) =>
						request.approver_id === approver.user_id &&
						request.sequence_order === approver.sequence_order
				);

				return !alreadyCreated;
			});

			if (nextApprover) {
				await createApprovalRequest(expenseId, ruleId, nextApprover);
				return;
			}
		}
	}

	const requiredRejected = approvalRequests.some(
		(request) => request.is_required && request.status === 'rejected'
	);

	if (requiredRejected) {
		await updateExpenseStatus(expenseId, 'rejected', expense.company_id, expense.employee_id);
		return;
	}

	const requiredRequests = approvalRequests.filter((request) => request.is_required);
	const allRequiredApproved = requiredRequests.every((request) => request.status === 'approved');
	const total = approvalRequests.length;
	const approved = approvedRequests.length;
	const approvalPercentage = total > 0 ? (approved / total) * 100 : 0;
	const percentageMet = approvalPercentage >= rule.min_approval_percentage;
	const allDecided = pendingRequests.length === 0;

	if (allRequiredApproved && percentageMet) {
		logger.info(`Approval engine: Expense ${expenseId} completely approved.`);
		await updateExpenseStatus(expenseId, 'approved', expense.company_id, expense.employee_id);
		return;
	}

	if (allDecided && (!allRequiredApproved || !percentageMet)) {
		logger.info(`Approval engine: Expense ${expenseId} got rejected as minimum approvals/requirements were not met.`);
		await updateExpenseStatus(expenseId, 'rejected', expense.company_id, expense.employee_id);
	}
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
		throw new Error('Approval request not found');
	}

	if (request.status !== 'pending') {
		throw new Error('Already decided');
	}

	if (decision !== 'approved' && decision !== 'rejected') {
		throw new Error('Invalid decision');
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
	triggerApprovalFlow,
	handleApprovalDecision,
};
