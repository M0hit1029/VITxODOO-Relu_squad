const prisma = require('../dbs/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

const signup = async (req, res) => {
	try {
		const { name, email, password, country, base_currency } = req.body;

		if (!name || !email || !password || !country || !base_currency) {
			return res.status(400).json({ message: 'All fields are required.' });
		}

		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return res.status(409).json({ message: 'User already exists.' });
		}

		const company = await prisma.company.create({
			data: {
				name: `${name}'s Company`,
				country,
				base_currency,
			},
		});

		const password_hash = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				company_id: company.id,
				name,
				email,
				password_hash,
				role: 'admin',
			},
		});

		const token = jwt.sign(
			{ userId: user.id, role: user.role, companyId: company.id },
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRES_IN }
		);

		return res.status(201).json({
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				companyId: company.id,
			},
		});
	} catch (error) {
		return res.status(500).json({ message: 'Signup failed.' });
	}
};

const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await prisma.user.findUnique({
			where: { email },
			include: { company: true },
		});

		if (!user) {
			return res.status(401).json({ message: 'Invalid credentials.' });
		}

		const isPasswordValid = await bcrypt.compare(password, user.password_hash);

		if (!isPasswordValid) {
			return res.status(401).json({ message: 'Invalid credentials.' });
		}

		const token = jwt.sign(
			{ userId: user.id, role: user.role, companyId: user.company_id },
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRES_IN }
		);

		return res.status(200).json({
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				companyId: user.company_id,
				company: {
					base_currency: user.company.base_currency,
					name: user.company.name,
				},
			},
		});
	} catch (error) {
		return res.status(500).json({ message: 'Login failed.' });
	}
};

const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;

		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (user) {
			const token = crypto.randomBytes(32).toString('hex');
			const reset_token_expiry = new Date(Date.now() + 60 * 60 * 1000);

			await prisma.user.update({
				where: { id: user.id },
				data: {
					reset_token: token,
					reset_token_expiry,
				},
			});

			const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
			await emailService.sendResetEmail(email, resetLink);
		}

		return res.status(200).json({
			message: 'If that email exists, a reset link has been sent.',
		});
	} catch (error) {
		return res.status(500).json({ message: 'Forgot password failed.' });
	}
};

const resetPassword = async (req, res) => {
	try {
		const { token, newPassword } = req.body;

		const user = await prisma.user.findFirst({
			where: {
				reset_token: token,
				reset_token_expiry: {
					gt: new Date(),
				},
			},
		});

		if (!user) {
			return res.status(400).json({ message: 'Invalid or expired token.' });
		}

		const password_hash = await bcrypt.hash(newPassword, 10);

		await prisma.user.update({
			where: { id: user.id },
			data: {
				password_hash,
				reset_token: null,
				reset_token_expiry: null,
			},
		});

		return res.status(200).json({ message: 'Password reset successfully.' });
	} catch (error) {
		return res.status(500).json({ message: 'Reset password failed.' });
	}
};

module.exports = {
	signup,
	login,
	forgotPassword,
	resetPassword,
};
