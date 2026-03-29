const prisma = require('../dbs/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/emailService');

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

		return res.status(200).json(users);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to fetch users.' });
	}
};

const createUser = async (req, res) => {
	try {
		const { name, email, role, manager_id } = req.body;

		if (!name || !email || !role) {
			return res.status(400).json({ message: 'Name, email and role are required.' });
		}

		if (role !== 'manager' && role !== 'employee') {
			return res.status(400).json({ message: 'Role must be manager or employee.' });
		}

		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
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
			},
		});

		await emailService.sendPasswordEmail(email, rawPassword);

		return res.status(201).json(user);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to create user.' });
	}
};

const updateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, role, manager_id } = req.body;

		const existingUser = await prisma.user.findFirst({
			where: {
				id,
				company_id: req.user.company_id,
			},
		});

		if (!existingUser) {
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
			},
		});

		return res.status(200).json(updatedUser);
	} catch (error) {
		return res.status(500).json({ message: 'Failed to update user.' });
	}
};

const deleteUser = async (req, res) => {
	try {
		const { id } = req.params;

		if (id === req.user.id) {
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
			return res.status(400).json({
				message: 'Cannot delete user with pending approval requests. Reassign first.',
			});
		}

		await prisma.user.delete({
			where: { id },
		});

		return res.status(200).json({ message: 'User deleted successfully.' });
	} catch (error) {
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

		return res.status(200).json({ message: 'Password sent successfully.' });
	} catch (error) {
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
