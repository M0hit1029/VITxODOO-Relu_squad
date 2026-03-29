const prisma = require('../dbs/db');
const { serializeRule } = require('../utils/serializers');
const logger = require('../utils/logger');

const ruleInclude = {
	user: {
		select: {
			name: true,
			email: true,
		},
	},
	manager: {
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
		},
	},
	approvers: {
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
		},
		orderBy: {
			sequence_order: 'asc',
		},
	},
};

const getRules = async (req, res) => {
	try {
		const rules = await prisma.approvalRule.findMany({
			where: {
				company_id: req.user.company_id,
			},
			include: ruleInclude,
			orderBy: {
				created_at: 'desc',
			},
		});

		return res.status(200).json(rules.map(serializeRule));
	} catch (error) {
		logger.error(`Failed to fetch rules for company ${req.user?.company_id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to fetch rules.' });
	}
};

const validateCompanyUser = async (userId, companyId) => {
	if (!userId) {
		return null;
	}

	return prisma.user.findFirst({
		where: {
			id: userId,
			company_id: companyId,
		},
	});
};

const normalizeApprovers = (approvers = []) => {
	if (!Array.isArray(approvers)) {
		return [];
	}

	return approvers
		.map((approver, index) => ({
			user_id: approver.user_id || approver.userId,
			sequence_order:
				typeof approver.sequence_order !== 'undefined'
					? Number(approver.sequence_order)
					: typeof approver.sequenceOrder !== 'undefined'
						? Number(approver.sequenceOrder)
						: index + 1,
			is_required:
				typeof approver.is_required !== 'undefined'
					? Boolean(approver.is_required)
					: Boolean(approver.isRequired),
		}))
		.filter((approver) => approver.user_id);
};

const parseRulePayload = (body = {}) => {
	const user_id = body.user_id || body.employeeId;
	const description = body.description || body.name;
	const manager_id =
		typeof body.manager_id !== 'undefined'
			? body.manager_id || null
			: typeof body.managerId !== 'undefined'
				? body.managerId || null
				: undefined;
	const is_manager_approver =
		typeof body.is_manager_approver !== 'undefined'
			? body.is_manager_approver
			: body.isManagerRequired;
	const mode = body.mode;
	const approvers_sequence =
		typeof body.approvers_sequence !== 'undefined'
			? body.approvers_sequence
			: mode === 'sequential';
	const minApprovalPercentage =
		typeof body.min_approval_percentage !== 'undefined'
			? body.min_approval_percentage
			: body.minApprovalPercentage;
	const approvers = normalizeApprovers(body.approvers);

	return {
		user_id,
		description,
		manager_id,
		is_manager_approver: Boolean(is_manager_approver),
		approvers_sequence: Boolean(approvers_sequence),
		min_approval_percentage:
			Boolean(approvers_sequence) ? 100 : Number.isFinite(Number(minApprovalPercentage)) ? Number(minApprovalPercentage) : 100,
		approvers,
	};
};

const validateApprovers = async (approvers, companyId) => {
	if (!Array.isArray(approvers) || approvers.length === 0) {
		return true;
	}

	const userIds = [...new Set(approvers.map((item) => item.user_id).filter(Boolean))];
	if (userIds.length === 0) {
		return false;
	}

	const users = await prisma.user.findMany({
		where: {
			id: { in: userIds },
			company_id: companyId,
		},
		select: {
			id: true,
		},
	});

	return users.length === userIds.length;
};

const validateRulePayload = async ({
	payload,
	companyId,
	existingRuleId = null,
}) => {
	if (!payload.user_id || !payload.description) {
		return 'user_id and description are required.';
	}

	if (!Number.isInteger(payload.min_approval_percentage) || payload.min_approval_percentage < 0 || payload.min_approval_percentage > 100) {
		return 'Minimum approval percentage must be between 0 and 100.';
	}

	const targetUser = await validateCompanyUser(payload.user_id, companyId);
	if (!targetUser) {
		return 'Invalid user_id for this company.';
	}

	if (targetUser.role !== 'employee') {
		return 'Approval rules can only be assigned to employees.';
	}

	if (payload.manager_id !== undefined && payload.manager_id !== null) {
		const manager = await validateCompanyUser(payload.manager_id, companyId);
		if (!manager) {
			return 'Invalid manager_id for this company.';
		}

		if (manager.id === payload.user_id) {
			return 'An employee cannot be their own manager approver.';
		}

		if (!['manager', 'admin'].includes(manager.role)) {
			return 'Manager override must be a manager or admin user.';
		}
	}

	if (payload.is_manager_approver && !payload.manager_id && !targetUser.manager_id) {
		return 'This rule requires a manager, but the employee has no manager assigned.';
	}

	const validApprovers = await validateApprovers(payload.approvers, companyId);
	if (!validApprovers) {
		return 'One or more approvers are invalid for this company.';
	}

	const approverIds = payload.approvers.map((approver) => approver.user_id);
	if (new Set(approverIds).size !== approverIds.length) {
		return 'Approvers cannot be duplicated in the same rule.';
	}

	if (payload.is_manager_approver) {
		const effectiveManagerId = payload.manager_id || targetUser.manager_id;
		if (effectiveManagerId && approverIds.includes(effectiveManagerId)) {
			return 'Do not add the manager twice. Use the manager approver toggle instead.';
		}
	}

	if (approverIds.includes(payload.user_id)) {
		return 'An employee cannot approve their own expense.';
	}

	const existingRule = await prisma.approvalRule.findFirst({
		where: {
			company_id: companyId,
			user_id: payload.user_id,
			...(existingRuleId ? { NOT: { id: existingRuleId } } : {}),
		},
		select: {
			id: true,
		},
	});

	if (existingRule) {
		return 'An approval rule already exists for this employee. Edit the existing rule instead.';
	}

	return null;
};

const fetchRule = async (ruleId) => {
	return prisma.approvalRule.findUnique({
		where: { id: ruleId },
		include: ruleInclude,
	});
};

const createRule = async (req, res) => {
	try {
		const payload = parseRulePayload(req.body);
		const validationMessage = await validateRulePayload({
			payload,
			companyId: req.user.company_id,
		});

		if (validationMessage) {
			logger.warn(`Rule creation failed for admin ${req.user.id}: ${validationMessage}`);
			return res.status(400).json({ message: validationMessage });
		}

		const rule = await prisma.approvalRule.create({
			data: {
				company_id: req.user.company_id,
				user_id: payload.user_id,
				description: payload.description,
				manager_id: payload.manager_id || null,
				is_manager_approver: payload.is_manager_approver,
				approvers_sequence: payload.approvers_sequence,
				min_approval_percentage: payload.min_approval_percentage,
			},
		});

		if (payload.approvers.length > 0) {
			await prisma.approvalRuleApprover.createMany({
				data: payload.approvers.map((approver, index) => ({
					rule_id: rule.id,
					user_id: approver.user_id,
					sequence_order: approver.sequence_order || index + 1,
					is_required: approver.is_required,
				})),
			});
		}

		const fullRule = await fetchRule(rule.id);

		logger.info(`Rule ${rule.id} created successfully by admin ${req.user.id}.`);
		return res.status(201).json(serializeRule(fullRule));
	} catch (error) {
		logger.error(`Failed to create rule by admin ${req.user?.id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to create rule.' });
	}
};

const updateRule = async (req, res) => {
	try {
		const existingRule = await prisma.approvalRule.findFirst({
			where: {
				id: req.params.id,
				company_id: req.user.company_id,
			},
		});

		if (!existingRule) {
			logger.warn(`Rule update failed: Rule ${req.params.id} not found for company ${req.user.company_id}`);
			return res.status(404).json({ message: 'Rule not found.' });
		}

		const payload = parseRulePayload({
			user_id: existingRule.user_id,
			description: existingRule.description,
			manager_id: existingRule.manager_id,
			is_manager_approver: existingRule.is_manager_approver,
			approvers_sequence: existingRule.approvers_sequence,
			min_approval_percentage: existingRule.min_approval_percentage,
			...req.body,
		});

		const validationMessage = await validateRulePayload({
			payload,
			companyId: req.user.company_id,
			existingRuleId: existingRule.id,
		});

		if (validationMessage) {
			logger.warn(`Rule update failed for admin ${req.user.id}: ${validationMessage}`);
			return res.status(400).json({ message: validationMessage });
		}

		await prisma.approvalRule.update({
			where: {
				id: req.params.id,
			},
			data: {
				user_id: payload.user_id,
				description: payload.description,
				manager_id: payload.manager_id || null,
				is_manager_approver: payload.is_manager_approver,
				approvers_sequence: payload.approvers_sequence,
				min_approval_percentage: payload.min_approval_percentage,
			},
		});

		await prisma.approvalRuleApprover.deleteMany({
			where: {
				rule_id: req.params.id,
			},
		});

		if (payload.approvers.length > 0) {
			await prisma.approvalRuleApprover.createMany({
				data: payload.approvers.map((approver, index) => ({
					rule_id: req.params.id,
					user_id: approver.user_id,
					sequence_order: approver.sequence_order || index + 1,
					is_required: approver.is_required,
				})),
			});
		}

		const updatedRule = await fetchRule(req.params.id);

		logger.info(`Rule ${req.params.id} updated successfully by admin ${req.user.id}.`);
		return res.status(200).json(serializeRule(updatedRule));
	} catch (error) {
		logger.error(`Failed to update rule ${req.params.id} by admin ${req.user?.id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to update rule.' });
	}
};

const deleteRule = async (req, res) => {
	try {
		const existingRule = await prisma.approvalRule.findFirst({
			where: {
				id: req.params.id,
				company_id: req.user.company_id,
			},
			select: {
				id: true,
			},
		});

		if (!existingRule) {
			logger.warn(`Rule deletion failed: Rule ${req.params.id} not found for company ${req.user.company_id}`);
			return res.status(404).json({ message: 'Rule not found.' });
		}

		const linkedApprovalRequests = await prisma.approvalRequest.count({
			where: {
				rule_id: req.params.id,
			},
		});

		if (linkedApprovalRequests > 0) {
			return res.status(400).json({
				message: 'This rule already has approval history and cannot be deleted. Edit it instead.',
			});
		}

		await prisma.approvalRuleApprover.deleteMany({
			where: {
				rule_id: req.params.id,
			},
		});

		await prisma.approvalRule.delete({
			where: {
				id: req.params.id,
			},
		});

		logger.info(`Rule ${req.params.id} deleted successfully by admin ${req.user.id}.`);
		return res.status(200).json({ message: 'Rule deleted successfully.' });
	} catch (error) {
		logger.error(`Failed to delete rule ${req.params.id} by admin ${req.user?.id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to delete rule.' });
	}
};

module.exports = {
	getRules,
	createRule,
	updateRule,
	deleteRule,
};
