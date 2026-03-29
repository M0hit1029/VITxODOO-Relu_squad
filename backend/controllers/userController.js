const prisma = require('../dbs/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { serializeUser } = require('../utils/serializers');
const logger = require('../utils/logger');

const getUsers = async (req, res) => {
	try {
		const users = await prisma.user.findMany({
			where: {
				company_id: req.user.company_id,
			},
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				manager_id: true,
				created_at: true,
				manager: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				created_at: 'desc',
			},
		});

		return res.status(200).json(users.map((user) => serializeUser(user)));
	} catch (error) {
		logger.error(`Failed to fetch users for company ${req.user.company_id}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to fetch users.' });
	}
};

const createUser = async (req, res) => {
	try {
		const name = req.body?.name || req.body?.fullName;
		const email = req.body?.email;
		const role = req.body?.role;
		const manager_id = req.body?.manager_id || req.body?.managerId || null;

		if (!name || !email || !role) {
			logger.warn(`User creation failed: Missing required fields by ${req.user.email}`);
			return res.status(400).json({ message: 'Name, email and role are required.' });
		}

		if (role !== 'manager' && role !== 'employee') {
			logger.warn(`User creation failed: Invalid role ${role} by ${req.user.email}`);
			return res.status(400).json({ message: 'Role must be manager or employee.' });
		}

		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			logger.warn(`User creation failed: Email ${email} already in use. Checked by ${req.user.email}`);
			return res.status(409).json({ message: 'User already exists.' });
		}

		if (manager_id) {
			const manager = await prisma.user.findFirst({
				where: {
					id: manager_id,
					company_id: req.user.company_id,
				},
			});

			if (!manager) {
				logger.warn(`User creation failed: Invalid manager_id ${manager_id} provided by ${req.user.email}`);
				return res.status(400).json({ message: 'Invalid manager_id for this company.' });
			}
		}

		const rawPassword = crypto.randomBytes(5).toString('hex');
		const password_hash = await bcrypt.hash(rawPassword, 10);

		const user = await prisma.user.create({
			data: {
				company_id: req.user.company_id,
				name,
				email,
				role,
				manager_id: manager_id || null,
				password_hash,
			},
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				manager_id: true,
				company_id: true,
				created_at: true,
				manager: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		await emailService.sendPasswordEmail(email, rawPassword);

		logger.info(`User ${email} created successfully by admin ${req.user.email}.`);
		return res.status(201).json(serializeUser(user, { status: 'active' }));
	} catch (error) {
		logger.error(`User creation failed by admin ${req.user?.email}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to create user.' });
	}
};

const updateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const name = req.body?.name || req.body?.fullName;
		const role = req.body?.role;
		const manager_id =
			typeof req.body?.managerId !== 'undefined'
				? req.body?.managerId || null
				: typeof req.body?.manager_id !== 'undefined'
					? req.body?.manager_id || null
					: undefined;

		const existingUser = await prisma.user.findFirst({
			where: {
				id,
				company_id: req.user.company_id,
			},
		});

		if (!existingUser) {
			logger.warn(`User update failed: User ${id} not found by ${req.user.email}`);
			return res.status(404).json({ message: 'User not found.' });
		}

		if (role && role !== 'manager' && role !== 'employee') {
			return res.status(400).json({ message: 'Role must be manager or employee.' });
		}

		if (manager_id) {
			const manager = await prisma.user.findFirst({
				where: {
					id: manager_id,
					company_id: req.user.company_id,
				},
			});

			if (!manager) {
				logger.warn(`User update failed: Invalid manager_id ${manager_id} provided by ${req.user.email}`);
				return res.status(400).json({ message: 'Invalid manager_id for this company.' });
			}
		}

		const data = {};

		if (typeof name !== 'undefined') {
			data.name = name;
		}

		if (typeof role !== 'undefined') {
			data.role = role;
		}

		if (typeof manager_id !== 'undefined') {
			data.manager_id = manager_id;
		}

		const updatedUser = await prisma.user.update({
			where: { id },
			data,
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				manager_id: true,
				company_id: true,
				created_at: true,
				manager: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		logger.info(`User ${id} updated successfully by admin ${req.user.email}.`);
		return res.status(200).json(serializeUser(updatedUser));
	} catch (error) {
		logger.error(`User update failed by admin ${req.user?.email}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to update user.' });
	}
};

const deleteUser = async (req, res) => {
	try {
		const { id } = req.params;

		if (id === req.user.id) {
			logger.warn(`User deletion failed: Admin ${req.user.email} attempted to delete themselves.`);
			return res.status(400).json({ message: 'Admin cannot delete themselves.' });
		}

		const user = await prisma.user.findFirst({
			where: {
				id,
				company_id: req.user.company_id,
			},
		});

		if (!user) {
			return res.status(404).json({ message: 'User not found.' });
		}

		const pendingApprovals = await prisma.approvalRequest.count({
			where: {
				approver_id: id,
				status: 'pending',
			},
		});

		if (pendingApprovals > 0) {
			logger.warn(`User deletion failed: User ${id} has pending approvals. Attempted by ${req.user.email}`);
			return res.status(400).json({
				message: 'Cannot delete user with pending approval requests. Reassign first.',
			});
		}

		await prisma.user.delete({
			where: { id },
		});

		logger.info(`User ${id} deleted successfully by admin ${req.user.email}.`);
		return res.status(200).json({ message: 'User deleted successfully.' });
	} catch (error) {
		logger.error(`User deletion failed by admin ${req.user?.email}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to delete user.' });
	}
};

const sendPassword = async (req, res) => {
	try {
		const { id } = req.params;

		const user = await prisma.user.findFirst({
			where: {
				id,
				company_id: req.user.company_id,
			},
		});

		if (!user) {
			return res.status(404).json({ message: 'User not found.' });
		}

		const rawPassword = crypto.randomBytes(5).toString('hex');
		const password_hash = await bcrypt.hash(rawPassword, 10);

		await prisma.user.update({
			where: { id: user.id },
			data: {
				password_hash,
			},
		});

		await emailService.sendPasswordEmail(user.email, rawPassword);

		logger.info(`New password pushed to user ${user.email} by admin ${req.user.email}.`);
		return res.status(200).json({ message: 'Password sent successfully.' });
	} catch (error) {
		logger.error(`Failed to send password to user ${req.params?.id} by admin ${req.user?.email}: ${error.message}`);
		return res.status(500).json({ message: 'Failed to send password.' });
	}
};

module.exports = {
	getUsers,
	createUser,
	updateUser,
	deleteUser,
	sendPassword,
};
