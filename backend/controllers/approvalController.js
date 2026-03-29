const prisma = require('../dbs/db');
const approvalEngine = require('../services/approvalEngine');
const logger = require('../utils/logger');

const getPendingApprovals = async (req, res) => {
	try {
		const pending = await prisma.approvalRequest.findMany({
			where: {
				approver_id: req.user.id,
				status: 'pending',
				expense: {
					company_id: req.user.company_id,
				},
			},
			include: {
				expense: {
					include: {
						employee: {
							select: {
								name: true,
							},
						},
						company: {
							select: {
								base_currency: true,
							},
						},
					},
				},
				approver: true,
			},
			orderBy: {
				created_at: 'asc',
			},
		});

		return res.status(200).json(pending);
	} catch (error) {
		logger.error(`Failed to fetch pending approvals for user ${req.user.id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to fetch pending approvals.' });
	}
};

const approveExpense = async (req, res) => {
	try {
		const request = await prisma.approvalRequest.findUnique({
			where: {
				id: req.params.id,
			},
			include: {
				expense: true,
			},
		});

		if (!request || request.expense.company_id !== req.user.company_id) {
			logger.warn(`Approve expense failed: Request ${req.params.id} not found by user ${req.user.id}`);
			return res.status(404).json({ message: 'Approval request not found.' });
		}

		if (request.approver_id !== req.user.id) {
			logger.warn(`Approve expense failed: Forbidden for user ${req.user.id} on request ${req.params.id}`);
			return res.status(403).json({ message: 'Forbidden' });
		}

		if (request.expense.employee_id === req.user.id) {
			logger.warn(`Approve expense failed: User ${req.user.id} attempted to approve own expense ${request.expense.id}`);
			return res.status(400).json({ message: 'Cannot approve own expense' });
		}

		await approvalEngine.handleApprovalDecision(
			req.params.id,
			'approved',
			req.body?.comment,
			req.user.id
		);

		logger.info(`Expense request ${req.params.id} approved successfully by user ${req.user.id}.`);
		return res.status(200).json({ message: 'Expense approved successfully.' });
	} catch (error) {
		if (error.message === 'Already decided') {
			logger.warn(`Approve expense failed: Request ${req.params.id} already decided.`);
			return res.status(400).json({ message: 'Already decided' });
		}

		logger.error(`Failed to approve expense request ${req.params.id} by user ${req.user?.id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to approve expense.' });
	}
};

const rejectExpense = async (req, res) => {
	try {
		const comment = req.body?.comment;

		if (!comment) {
			logger.warn(`Reject expense failed: Comment missing from user ${req.user.id}`);
			return res.status(400).json({ message: 'Comment is required for rejection.' });
		}

		const request = await prisma.approvalRequest.findUnique({
			where: {
				id: req.params.id,
			},
			include: {
				expense: true,
			},
		});

		if (!request || request.expense.company_id !== req.user.company_id) {
			logger.warn(`Reject expense failed: Request ${req.params.id} not found by user ${req.user.id}`);
			return res.status(404).json({ message: 'Approval request not found.' });
		}

		if (request.approver_id !== req.user.id) {
			logger.warn(`Reject expense failed: Forbidden for user ${req.user.id}`);
			return res.status(403).json({ message: 'Forbidden' });
		}

		if (request.expense.employee_id === req.user.id) {
			logger.warn(`Reject expense failed: User ${req.user.id} attempted to reject own expense`);
			return res.status(400).json({ message: 'Cannot approve own expense' });
		}

		await approvalEngine.handleApprovalDecision(req.params.id, 'rejected', comment, req.user.id);

		logger.info(`Expense request ${req.params.id} rejected by user ${req.user.id}.`);
		return res.status(200).json({ message: 'Expense rejected successfully.' });
	} catch (error) {
		if (error.message === 'Already decided') {
			logger.warn(`Reject expense failed: Request ${req.params.id} already decided.`);
			return res.status(400).json({ message: 'Already decided' });
		}

		logger.error(`Failed to reject expense request ${req.params.id} by user ${req.user?.id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to reject expense.' });
	}
};

module.exports = {
	getPendingApprovals,
	approveExpense,
	rejectExpense,
};
