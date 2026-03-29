const prisma = require('../dbs/db');
const currencyService = require('../services/currencyService');
const approvalEngine = require('../services/approvalEngine');
const upload = require('../src/config/upload');
const { getBackendCategory, serializeExpense } = require('../utils/serializers');
const logger = require('../utils/logger');

const allowedCategories = [
	'Food',
	'Travel',
	'Accommodation',
	'Software/Tools',
	'Supplies',
	'Utilities',
	'Miscellaneous',
	'Entertainment',
	'Medical',
	'Office Supplies',
];

const canAccessExpense = (user, expense) => {
	if (user.role === 'admin') {
		return true;
	}

	if (user.role === 'employee') {
		return expense.employee_id === user.id;
	}

	if (user.role === 'manager') {
		return (
			expense.employee_id === user.id ||
			expense.employee?.manager_id === user.id ||
			expense.approval_requests?.some((request) => request.approver_id === user.id)
		);
	}

	return false;
};

const findExpenseById = (expenseId) =>
	prisma.expense.findUnique({
		where: {
			id: expenseId,
		},
		include: {
			company: {
				select: {
					base_currency: true,
				},
			},
			employee: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					manager_id: true,
				},
			},
			expense_logs: {
				include: {
					actor: {
						select: {
							name: true,
						},
					},
				},
				orderBy: {
					timestamp: 'asc',
				},
			},
			approval_requests: {
				include: {
					approver: {
						select: {
							id: true,
							name: true,
							role: true,
						},
					},
				},
				orderBy: {
					sequence_order: 'asc',
				},
			},
		},
	});

const buildExpensePayload = (body = {}, file) => {
	const category = getBackendCategory(body.category);

	return {
		description: body.description,
		category,
		expense_date: body.expense_date || body.expenseDate,
		amount: body.amount,
		currency: body.currency,
		paid_by: body.paid_by || body.paidBy,
		remarks: body.remarks,
		receipt_url: body.receipt_url || body.receiptUrl,
		amount_in_base:
			typeof body.amount_in_base !== 'undefined'
				? body.amount_in_base
				: typeof body.amountInBase !== 'undefined'
					? body.amountInBase
					: undefined,
		file,
	};
};

const getExpenses = async (req, res) => {
	try {
		const companyId = req.user.company_id;
		let where = { company_id: companyId };

		if (req.user.role === 'employee' || req.user.role === 'manager') {
			where = {
				employee_id: req.user.id,
				company_id: companyId,
			};
		}

		const expenses = await prisma.expense.findMany({
			where,
			include: {
				company: {
					select: {
						base_currency: true,
					},
				},
				employee: {
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
						manager_id: true,
					},
				},
				expense_logs: {
					include: {
						actor: {
							select: {
								name: true,
							},
						},
					},
					orderBy: {
						timestamp: 'asc',
					},
				},
			},
			orderBy: {
				created_at: 'desc',
			},
		});

		return res.status(200).json(expenses.map((expense) => serializeExpense(expense)));
	} catch (error) {
		logger.error(`Failed to fetch expenses for company ${req.user.company_id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to fetch expenses.' });
	}
};

const getExpense = async (req, res) => {
	try {
		const expense = await findExpenseById(req.params.id);

		if (!expense || expense.company_id !== req.user.company_id) {
			return res.status(404).json({ message: 'Expense not found.' });
		}

		if (!canAccessExpense(req.user, expense)) {
			logger.warn(`Expense ${req.params.id} access forbidden for user ${req.user.id}`);
			return res.status(403).json({ message: 'Forbidden' });
		}

		return res.status(200).json(serializeExpense(expense));
	} catch (error) {
		logger.error(`Failed to fetch expense ${req.params.id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to fetch expense.' });
	}
};

const createExpense = async (req, res) => {
	try {
		const payload = buildExpensePayload(req.body, req.file);
		const {
			description,
			category,
			expense_date,
			amount,
			currency,
			paid_by,
			remarks,
			receipt_url,
			amount_in_base,
		} = payload;

		if (!description || !category || !expense_date || !amount || !currency || !paid_by) {
			logger.warn(`Expense creation failed: Missing fields from user ${req.user.id}`);
			return res.status(400).json({ message: 'Required fields are missing.' });
		}

		if (!allowedCategories.includes(category)) {
			logger.warn(`Expense creation failed: Invalid category '${category}' from user ${req.user.id}`);
			return res.status(400).json({ message: 'Invalid category.' });
		}

		const numericAmount = parseFloat(amount);
		if (Number.isNaN(numericAmount)) {
			logger.warn(`Expense creation failed: Invalid amount '${amount}' from user ${req.user.id}`);
			return res.status(400).json({ message: 'Invalid amount.' });
		}

		const amountInBase =
			typeof amount_in_base !== 'undefined' && amount_in_base !== null && amount_in_base !== ''
				? parseFloat(amount_in_base)
				: null;

		const createdExpense = await prisma.expense.create({
			data: {
				company_id: req.user.company_id,
				employee_id: req.user.id,
				description,
				category,
				expense_date: new Date(expense_date),
				amount: numericAmount,
				currency,
				paid_by,
				remarks: remarks || null,
				receipt_url: payload.file ? `/uploads/${payload.file.filename}` : receipt_url || null,
				status: 'draft',
				amount_in_base: Number.isFinite(amountInBase) ? amountInBase : null,
			},
		});

		await prisma.expenseLog.create({
			data: {
				expense_id: createdExpense.id,
				actor_id: req.user.id,
				action: 'created',
				note: 'Expense created as draft',
			},
		});

		const expense = await findExpenseById(createdExpense.id);

		logger.info(`Expense ${createdExpense.id} created successfully by user ${req.user.id}.`);
		return res.status(201).json(serializeExpense(expense));
	} catch (error) {
		logger.error(`Failed to create expense for user ${req.user?.id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to create expense.' });
	}
};

const updateExpense = async (req, res) => {
	try {
		const expense = await prisma.expense.findUnique({
			where: {
				id: req.params.id,
			},
		});

		if (!expense || expense.company_id !== req.user.company_id) {
			return res.status(404).json({ message: 'Expense not found.' });
		}

		const isAdmin = req.user.role === 'admin';
		const isOwnerDraft = expense.employee_id === req.user.id && expense.status === 'draft';

		if (!isAdmin && !isOwnerDraft) {
			logger.warn(`Update expense failed: Forbidden for user ${req.user.id} on expense ${req.params.id}`);
			return res.status(403).json({ message: 'Forbidden' });
		}

		const payload = buildExpensePayload(req.body, req.file);
		const data = {};

		if (typeof payload.description !== 'undefined') {
			data.description = payload.description;
		}

		if (typeof payload.category !== 'undefined') {
			if (!allowedCategories.includes(payload.category)) {
				return res.status(400).json({ message: 'Invalid category.' });
			}
			data.category = payload.category;
		}

		if (typeof payload.expense_date !== 'undefined') {
			data.expense_date = new Date(payload.expense_date);
		}

		if (typeof payload.amount !== 'undefined') {
			const numericAmount = parseFloat(payload.amount);
			if (Number.isNaN(numericAmount)) {
				return res.status(400).json({ message: 'Invalid amount.' });
			}
			data.amount = numericAmount;
		}

		if (typeof payload.currency !== 'undefined') {
			data.currency = payload.currency;
		}

		if (typeof payload.paid_by !== 'undefined') {
			data.paid_by = payload.paid_by;
		}

		if (typeof payload.remarks !== 'undefined') {
			data.remarks = payload.remarks;
		}

		if (typeof payload.receipt_url !== 'undefined') {
			data.receipt_url = payload.receipt_url;
		}

		if (typeof payload.amount_in_base !== 'undefined') {
			const parsedAmountInBase = parseFloat(payload.amount_in_base);
			if (!Number.isNaN(parsedAmountInBase)) {
				data.amount_in_base = parsedAmountInBase;
			}
		}

		if (payload.file) {
			data.receipt_url = `/uploads/${payload.file.filename}`;
		}

		await prisma.expense.update({
			where: {
				id: req.params.id,
			},
			data,
		});

		const updatedExpense = await findExpenseById(req.params.id);

		logger.info(`Expense ${req.params.id} updated successfully by user ${req.user.id}.`);
		return res.status(200).json(serializeExpense(updatedExpense));
	} catch (error) {
		logger.error(`Failed to update expense ${req.params.id} by user ${req.user?.id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to update expense.' });
	}
};

const submitExpense = async (req, res) => {
	try {
		const expense = await prisma.expense.findUnique({
			where: {
				id: req.params.id,
			},
			include: {
				company: {
					select: {
						base_currency: true,
					},
				},
			},
		});

		if (!expense || expense.company_id !== req.user.company_id) {
			return res.status(404).json({ message: 'Expense not found.' });
		}

		if (expense.employee_id !== req.user.id || expense.status !== 'draft') {
			logger.warn(`Submit expense failed: User ${req.user.id} cannot submit expense ${req.params.id}`);
			return res.status(403).json({ message: 'Only owner can submit draft expense.' });
		}

		let converted = null;
		let logNote = null;
		let approvalFlow = null;

		try {
			converted = await currencyService.convertCurrency(
				expense.amount,
				expense.currency,
				expense.company.base_currency,
			);
		} catch (error) {
			if (error.message === 'CONVERSION_FAILED') {
				converted = expense.amount_in_base || null;
				logNote = 'Currency conversion failed. Amount stored in original currency.';
				logger.warn(`Currency conversion failed when submitting expense ${expense.id}: ${error.message}`);
			} else {
				throw error;
			}
		}

		try {
			approvalFlow = await approvalEngine.prepareApprovalFlow(expense.id);
		} catch (error) {
			if (error.code === 'NO_APPROVAL_ROUTE' || error.code === 'MANAGER_REQUIRED_MISSING') {
				await prisma.expenseLog.create({
					data: {
						expense_id: expense.id,
						actor_id: req.user.id,
						action: 'warning',
						note: error.message,
					},
				});

				return res.status(409).json({ message: error.message });
			}

			throw error;
		}

		await prisma.expense.update({
			where: {
				id: expense.id,
			},
			data: {
				status: 'submitted',
				amount_in_base: converted,
			},
		});

		await prisma.expenseLog.create({
			data: {
				expense_id: expense.id,
				actor_id: req.user.id,
				action: 'submitted',
				note: logNote,
			},
		});

		await approvalEngine.triggerApprovalFlow(expense.id, approvalFlow);

		const submittedExpense = await findExpenseById(expense.id);

		logger.info(`Expense ${expense.id} submitted for approval by user ${req.user.id}.`);
		return res.status(200).json(serializeExpense(submittedExpense));
	} catch (error) {
		logger.error(`Failed to submit expense ${req.params.id} by user ${req.user?.id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to submit expense.' });
	}
};

const overrideExpenseStatus = async (req, res) => {
	try {
		const decision = req.body?.decision;
		const comment = req.body?.comment || 'Resolved by admin override.';

		if (!['approved', 'rejected'].includes(decision)) {
			return res.status(400).json({ message: 'decision must be approved or rejected.' });
		}

		const expense = await prisma.expense.findUnique({
			where: {
				id: req.params.id,
			},
		});

		if (!expense || expense.company_id !== req.user.company_id) {
			return res.status(404).json({ message: 'Expense not found.' });
		}

		await prisma.expense.update({
			where: {
				id: expense.id,
			},
			data: {
				status: decision,
			},
		});

		await prisma.approvalRequest.updateMany({
			where: {
				expense_id: expense.id,
				status: 'pending',
			},
			data: {
				status: decision,
				comments: comment,
				decided_at: new Date(),
			},
		});

		await prisma.expenseLog.create({
			data: {
				expense_id: expense.id,
				actor_id: req.user.id,
				action: decision,
				note: `Admin override: ${comment}`,
			},
		});

		const overriddenExpense = await findExpenseById(expense.id);

		logger.info(`Expense ${expense.id} ${decision} by admin override from user ${req.user.id}.`);
		return res.status(200).json(serializeExpense(overriddenExpense));
	} catch (error) {
		logger.error(`Failed to override expense ${req.params.id} by admin ${req.user?.id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to override expense.' });
	}
};

const getLogs = async (req, res) => {
	try {
		const expense = await findExpenseById(req.params.id);

		if (!expense || expense.company_id !== req.user.company_id) {
			return res.status(404).json({ message: 'Expense not found.' });
		}

		if (!canAccessExpense(req.user, expense)) {
			return res.status(403).json({ message: 'Forbidden' });
		}

		const logs = await prisma.expenseLog.findMany({
			where: {
				expense_id: req.params.id,
			},
			include: {
				actor: {
					select: {
						name: true,
					},
				},
			},
			orderBy: {
				timestamp: 'asc',
			},
		});

		return res.status(200).json(
			logs.map((log) => ({
				id: log.id,
				actorId: log.actor_id,
				actorName: log.actor?.name || 'System',
				action: log.action,
				note: log.note || '',
				timestamp: log.timestamp,
			})),
		);
	} catch (error) {
		logger.error(`Failed to fetch logs for expense ${req.params.id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to fetch logs.' });
	}
};

const uploadReceipt = async (req, res) => {
	if (!req.file) {
		logger.warn(`Upload receipt failed: No file uploaded by user ${req.user?.id}`);
		return res.status(400).json({ message: 'No file uploaded.' });
	}

	logger.info(`Receipt uploaded: ${req.file.filename}`);
	return res.status(200).json({
		receiptUrl: `/uploads/${req.file.filename}`,
	});
};

module.exports = {
	getExpenses,
	getExpense,
	createExpense,
	updateExpense,
	submitExpense,
	overrideExpenseStatus,
	getLogs,
	uploadReceipt,
	upload,
};
