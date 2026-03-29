const prisma = require('../dbs/db');
const currencyService = require('../services/currencyService');
const upload = require('../src/config/upload');

const allowedCategories = [
	'Food',
	'Travel',
	'Accommodation',
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
		return expense.employee_id === user.id || expense.employee?.manager_id === user.id;
	}

	return false;
};

const getExpenses = async (req, res) => {
	try {
		const companyId = req.user.company_id;
		let where = { company_id: companyId };

		if (req.user.role === 'employee') {
			where = {
				employee_id: req.user.id,
				company_id: companyId,
			};
		}

		if (req.user.role === 'manager') {
			where = {
				company_id: companyId,
				OR: [
					{ employee_id: req.user.id },
					{ employee: { manager_id: req.user.id } },
				],
			};
		}

		const expenses = await prisma.expense.findMany({
			where,
			include: {
				employee: {
					select: {
						name: true,
						email: true,
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
				},
			},
			orderBy: {
				created_at: 'desc',
			},
		});

		return res.status(200).json(expenses);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch expenses.' });
	}
};

const getExpense = async (req, res) => {
	try {
		const expense = await prisma.expense.findUnique({
			where: {
				id: req.params.id,
			},
			include: {
				employee: {
					select: {
						id: true,
						name: true,
						email: true,
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
				},
				approval_requests: {
					include: {
						approver: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});

		if (!expense || expense.company_id !== req.user.company_id) {
			return res.status(404).json({ message: 'Expense not found.' });
		}

		if (!canAccessExpense(req.user, expense)) {
			return res.status(403).json({ message: 'Forbidden' });
		}

		return res.status(200).json(expense);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch expense.' });
	}
};

const createExpense = async (req, res) => {
	try {
		const {
			description,
			category,
			expense_date,
			amount,
			currency,
			paid_by,
			remarks,
		} = req.body;

		if (!description || !category || !expense_date || !amount || !currency || !paid_by) {
			return res.status(400).json({ message: 'Required fields are missing.' });
		}

		if (!allowedCategories.includes(category)) {
			return res.status(400).json({ message: 'Invalid category.' });
		}

		const numericAmount = parseFloat(amount);
		if (Number.isNaN(numericAmount)) {
			return res.status(400).json({ message: 'Invalid amount.' });
		}

		const receipt_url = req.file ? `/uploads/${req.file.filename}` : null;

		const expense = await prisma.expense.create({
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
				receipt_url,
				status: 'draft',
			},
		});

		await prisma.expenseLog.create({
			data: {
				expense_id: expense.id,
				actor_id: req.user.id,
				action: 'created',
				note: 'Expense created as draft',
			},
		});

		return res.status(201).json(expense);
	} catch (error) {
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
			return res.status(403).json({ message: 'Forbidden' });
		}

		const {
			description,
			category,
			expense_date,
			amount,
			currency,
			paid_by,
			remarks,
			receipt_url,
		} = req.body;

		if (typeof category !== 'undefined' && !allowedCategories.includes(category)) {
			return res.status(400).json({ message: 'Invalid category.' });
		}

		const data = {};

		if (typeof description !== 'undefined') {
			data.description = description;
		}
		if (typeof category !== 'undefined') {
			data.category = category;
		}
		if (typeof expense_date !== 'undefined') {
			data.expense_date = new Date(expense_date);
		}
		if (typeof amount !== 'undefined') {
			const numericAmount = parseFloat(amount);
			if (Number.isNaN(numericAmount)) {
				return res.status(400).json({ message: 'Invalid amount.' });
			}
			data.amount = numericAmount;
		}
		if (typeof currency !== 'undefined') {
			data.currency = currency;
		}
		if (typeof paid_by !== 'undefined') {
			data.paid_by = paid_by;
		}
		if (typeof remarks !== 'undefined') {
			data.remarks = remarks;
		}
		if (typeof receipt_url !== 'undefined') {
			data.receipt_url = receipt_url;
		}
		if (req.file) {
			data.receipt_url = `/uploads/${req.file.filename}`;
		}

		const updatedExpense = await prisma.expense.update({
			where: {
				id: req.params.id,
			},
			data,
		});

		return res.status(200).json(updatedExpense);
	} catch (error) {
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
			return res.status(403).json({ message: 'Only owner can submit draft expense.' });
		}

		let converted = null;
		let logNote = null;

		try {
			converted = await currencyService.convertCurrency(
				expense.amount,
				expense.currency,
				expense.company.base_currency
			);
		} catch (error) {
			if (error.message === 'CONVERSION_FAILED') {
				converted = null;
				logNote = 'Currency conversion failed. Amount stored in original currency.';
			} else {
				throw error;
			}
		}

		const updatedExpense = await prisma.expense.update({
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

		const { triggerApprovalFlow } = require('../services/approvalEngine');
		await triggerApprovalFlow(expense.id);

		return res.status(200).json(updatedExpense);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to submit expense.' });
	}
};

const getLogs = async (req, res) => {
	try {
		const expense = await prisma.expense.findUnique({
			where: {
				id: req.params.id,
			},
			include: {
				employee: {
					select: {
						manager_id: true,
					},
				},
			},
		});

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

		return res.status(200).json(logs);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch logs.' });
	}
};

const uploadReceipt = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'No file uploaded.' });
	}

	return res.status(200).json({
		receipt_url: `/uploads/${req.file.filename}`,
	});
};

module.exports = {
	getExpenses,
	getExpense,
	createExpense,
	updateExpense,
	submitExpense,
	getLogs,
	uploadReceipt,
	upload,
};
