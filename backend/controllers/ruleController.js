const prisma = require('../dbs/db');
const { serializeRule } = require('../utils/serializers');
const logger = require('../utils/logger');

const getRules = async (req, res) => {
	try {
		const rules = await prisma.approvalRule.findMany({
			where: {
				company_id: req.user.company_id,
			},
			include: {
				user: {
					select: {
						name: true,
						email: true,
					},
				},
				manager: {
					select: {
						name: true,
					},
				},
				approvers: {
					include: {
						user: {
							select: {
								name: true,
							},
						},
					},
					orderBy: {
						sequence_order: 'asc',
					},
				},
			},
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

const createRule = async (req, res) => {
	try {
		const {
			user_id: requestUserId,
			description: requestDescription,
			manager_id: requestManagerId,
			is_manager_approver: requestManagerApprover,
			approvers_sequence: requestApproversSequence,
			min_approval_percentage: requestMinApprovalPercentage,
			approvers: requestApprovers,
		} = req.body;
		const user_id = requestUserId || req.body?.employeeId;
		const description = requestDescription || req.body?.name;
		const manager_id =
			typeof requestManagerId !== 'undefined'
				? requestManagerId || null
				: typeof req.body?.managerId !== 'undefined'
					? req.body?.managerId || null
					: null;
		const is_manager_approver =
			typeof requestManagerApprover !== 'undefined'
				? requestManagerApprover
				: req.body?.isManagerRequired;
		const approvers_sequence =
			typeof requestApproversSequence !== 'undefined'
				? requestApproversSequence
				: req.body?.mode === 'sequential';
		const min_approval_percentage =
			typeof requestMinApprovalPercentage !== 'undefined'
				? requestMinApprovalPercentage
				: req.body?.minApprovalPercentage;
		const approvers = Array.isArray(requestApprovers)
			? requestApprovers
			: Array.isArray(req.body?.approvers)
				? req.body.approvers.map((approver, index) => ({
						user_id: approver.user_id || approver.userId,
						sequence_order:
							typeof approver.sequence_order !== 'undefined'
								? approver.sequence_order
								: typeof approver.sequenceOrder !== 'undefined'
									? approver.sequenceOrder
									: index + 1,
						is_required:
							typeof approver.is_required !== 'undefined'
								? approver.is_required
								: approver.isRequired,
				  }))
				: [];

		if (!user_id || !description) {
			logger.warn(`Rule creation failed: Missing user_id or description from admin ${req.user.id}`);
			return res.status(400).json({ message: 'user_id and description are required.' });
		}

		const targetUser = await validateCompanyUser(user_id, req.user.company_id);
		if (!targetUser) {
			logger.warn(`Rule creation failed: Invalid user_id ${user_id} for company ${req.user.company_id}`);
			return res.status(400).json({ message: 'Invalid user_id for this company.' });
		}

		if (typeof manager_id !== 'undefined' && manager_id !== null) {
			const manager = await validateCompanyUser(manager_id, req.user.company_id);
			if (!manager) {
				logger.warn(`Rule creation failed: Invalid manager_id ${manager_id} for company ${req.user.company_id}`);
				return res.status(400).json({ message: 'Invalid manager_id for this company.' });
			}
		}

		if (Array.isArray(approvers) && approvers.length > 0) {
			const validApprovers = await validateApprovers(approvers, req.user.company_id);
			if (!validApprovers) {
				logger.warn(`Rule creation failed: Invalid approvers listed by admin ${req.user.id}`);
				return res.status(400).json({ message: 'One or more approvers are invalid for this company.' });
			}
		}

		const rule = await prisma.approvalRule.create({
			data: {
				company_id: req.user.company_id,
				user_id,
				description,
				manager_id: typeof manager_id === 'undefined' ? null : manager_id,
				is_manager_approver:
					typeof is_manager_approver === 'undefined' ? false : Boolean(is_manager_approver),
				approvers_sequence:
					typeof approvers_sequence === 'undefined' ? false : Boolean(approvers_sequence),
				min_approval_percentage:
					typeof min_approval_percentage === 'undefined' ? 100 : Number(min_approval_percentage),
			},
		});

		if (Array.isArray(approvers) && approvers.length > 0) {
			await prisma.approvalRuleApprover.createMany({
				data: approvers.map((item) => ({
					rule_id: rule.id,
					user_id: item.user_id,
					sequence_order: Number(item.sequence_order),
					is_required: Boolean(item.is_required),
				})),
			});
		}

		const fullRule = await prisma.approvalRule.findUnique({
			where: { id: rule.id },
			include: {
				user: {
					select: {
						name: true,
						email: true,
					},
				},
				manager: {
					select: {
						name: true,
					},
				},
				approvers: {
					include: {
						user: {
							select: {
								name: true,
							},
						},
					},
					orderBy: {
						sequence_order: 'asc',
					},
				},
			},
		});

		logger.info(`Rule ${fullRule.id} created successfully by admin ${req.user.id}.`);
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

		const {
			user_id: requestUserId,
			description: requestDescription,
			manager_id: requestManagerId,
			is_manager_approver: requestManagerApprover,
			approvers_sequence: requestApproversSequence,
			min_approval_percentage: requestMinApprovalPercentage,
			approvers: requestApprovers,
		} = req.body;
		const user_id = requestUserId || req.body?.employeeId;
		const description = requestDescription || req.body?.name;
		const manager_id =
			typeof requestManagerId !== 'undefined'
				? requestManagerId || null
				: typeof req.body?.managerId !== 'undefined'
					? req.body?.managerId || null
					: undefined;
		const is_manager_approver =
			typeof requestManagerApprover !== 'undefined'
				? requestManagerApprover
				: req.body?.isManagerRequired;
		const approvers_sequence =
			typeof requestApproversSequence !== 'undefined'
				? requestApproversSequence
				: req.body?.mode === 'sequential';
		const min_approval_percentage =
			typeof requestMinApprovalPercentage !== 'undefined'
				? requestMinApprovalPercentage
				: req.body?.minApprovalPercentage;
		const approvers = Array.isArray(requestApprovers)
			? requestApprovers
			: Array.isArray(req.body?.approvers)
				? req.body.approvers.map((approver, index) => ({
						user_id: approver.user_id || approver.userId,
						sequence_order:
							typeof approver.sequence_order !== 'undefined'
								? approver.sequence_order
								: typeof approver.sequenceOrder !== 'undefined'
									? approver.sequenceOrder
									: index + 1,
						is_required:
							typeof approver.is_required !== 'undefined'
								? approver.is_required
								: approver.isRequired,
				  }))
				: undefined;

		if (typeof user_id !== 'undefined') {
			const targetUser = await validateCompanyUser(user_id, req.user.company_id);
			if (!targetUser) {
				logger.warn(`Rule update failed: Invalid user_id ${user_id} for company ${req.user.company_id}`);
				return res.status(400).json({ message: 'Invalid user_id for this company.' });
			}
		}

		if (typeof manager_id !== 'undefined' && manager_id !== null) {
			const manager = await validateCompanyUser(manager_id, req.user.company_id);
			if (!manager) {
				logger.warn(`Rule update failed: Invalid manager_id ${manager_id} for company ${req.user.company_id}`);
				return res.status(400).json({ message: 'Invalid manager_id for this company.' });
			}
		}

		if (Array.isArray(approvers) && approvers.length > 0) {
			const validApprovers = await validateApprovers(approvers, req.user.company_id);
			if (!validApprovers) {
				logger.warn(`Rule update failed: Invalid approvers for rule ${req.params.id}`);
				return res.status(400).json({ message: 'One or more approvers are invalid for this company.' });
			}
		}

		const data = {};

		if (typeof user_id !== 'undefined') {
			data.user_id = user_id;
		}
		if (typeof description !== 'undefined') {
			data.description = description;
		}
		if (typeof manager_id !== 'undefined') {
			data.manager_id = manager_id;
		}
		if (typeof is_manager_approver !== 'undefined') {
			data.is_manager_approver = Boolean(is_manager_approver);
		}
		if (typeof approvers_sequence !== 'undefined') {
			data.approvers_sequence = Boolean(approvers_sequence);
		}
		if (typeof min_approval_percentage !== 'undefined') {
			data.min_approval_percentage = Number(min_approval_percentage);
		}

		await prisma.approvalRule.update({
			where: {
				id: req.params.id,
			},
			data,
		});

		if (Array.isArray(approvers)) {
			await prisma.approvalRuleApprover.deleteMany({
				where: {
					rule_id: req.params.id,
				},
			});

			if (approvers.length > 0) {
				await prisma.approvalRuleApprover.createMany({
					data: approvers.map((item) => ({
						rule_id: req.params.id,
						user_id: item.user_id,
						sequence_order: Number(item.sequence_order),
						is_required: Boolean(item.is_required),
					})),
				});
			}
		}

		const updatedRule = await prisma.approvalRule.findUnique({
			where: {
				id: req.params.id,
			},
			include: {
				user: {
					select: {
						name: true,
						email: true,
					},
				},
				manager: {
					select: {
						name: true,
					},
				},
				approvers: {
					include: {
						user: {
							select: {
								name: true,
							},
						},
					},
					orderBy: {
						sequence_order: 'asc',
					},
				},
			},
		});

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
