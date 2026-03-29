const prisma = require('../dbs/db');

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

		return res.status(200).json(rules);
	} catch (error) {
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
			user_id,
			description,
			manager_id,
			is_manager_approver,
			approvers_sequence,
			min_approval_percentage,
			approvers,
		} = req.body;

		if (!user_id || !description) {
			return res.status(400).json({ message: 'user_id and description are required.' });
		}

		const targetUser = await validateCompanyUser(user_id, req.user.company_id);
		if (!targetUser) {
			return res.status(400).json({ message: 'Invalid user_id for this company.' });
		}

		if (typeof manager_id !== 'undefined' && manager_id !== null) {
			const manager = await validateCompanyUser(manager_id, req.user.company_id);
			if (!manager) {
				return res.status(400).json({ message: 'Invalid manager_id for this company.' });
			}
		}

		if (Array.isArray(approvers) && approvers.length > 0) {
			const validApprovers = await validateApprovers(approvers, req.user.company_id);
			if (!validApprovers) {
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

		return res.status(201).json(fullRule);
	} catch (error) {
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
			return res.status(404).json({ message: 'Rule not found.' });
		}

		const {
			user_id,
			description,
			manager_id,
			is_manager_approver,
			approvers_sequence,
			min_approval_percentage,
			approvers,
		} = req.body;

		if (typeof user_id !== 'undefined') {
			const targetUser = await validateCompanyUser(user_id, req.user.company_id);
			if (!targetUser) {
				return res.status(400).json({ message: 'Invalid user_id for this company.' });
			}
		}

		if (typeof manager_id !== 'undefined' && manager_id !== null) {
			const manager = await validateCompanyUser(manager_id, req.user.company_id);
			if (!manager) {
				return res.status(400).json({ message: 'Invalid manager_id for this company.' });
			}
		}

		if (Array.isArray(approvers) && approvers.length > 0) {
			const validApprovers = await validateApprovers(approvers, req.user.company_id);
			if (!validApprovers) {
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

		return res.status(200).json(updatedRule);
	} catch (error) {
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

		return res.status(200).json({ message: 'Rule deleted successfully.' });
	} catch (error) {
		return res.status(500).json({ message: 'Failed to delete rule.' });
	}
};

module.exports = {
	getRules,
	createRule,
	updateRule,
	deleteRule,
};
