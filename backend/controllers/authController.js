const prisma = require('../dbs/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { getCompanySettings } = require('../services/companySettingsStore');
const { serializeCompany, serializeUser } = require('../utils/serializers');
const logger = require('../utils/logger');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isBcryptHash = (value) => typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);

const verifyPassword = async (user, rawPassword) => {
	if (!user?.password_hash || !rawPassword) {
		return false;
	}

	if (isBcryptHash(user.password_hash)) {
		return bcrypt.compare(rawPassword, user.password_hash);
	}

	// Backward compatibility for legacy records that stored plaintext values.
	const isLegacyMatch = user.password_hash === rawPassword;

	if (isLegacyMatch) {
		const password_hash = await bcrypt.hash(rawPassword, 10);
		await prisma.user.update({
			where: { id: user.id },
			data: { password_hash },
		});
		logger.info(`Upgraded legacy password hash format for ${user.email}.`);
	}

	return isLegacyMatch;
};

const signup = async (req, res) => {
	try {
		const name = String(req.body?.name || req.body?.fullName || '').trim();
		const email = normalizeEmail(req.body?.email);
		const password = req.body?.password;
		const country = String(req.body?.country || '').trim();
		const base_currency = req.body?.base_currency || req.body?.baseCurrency;
		const companyName = req.body?.companyName || `${name}'s Company`;

		if (!name || !email || !password || !country || !base_currency) {
			logger.warn('Signup failed: All fields are required.');
			return res.status(400).json({ message: 'All fields are required.' });
		}

		const existingUser = await prisma.user.findFirst({
			where: {
				email: {
					equals: email,
					mode: 'insensitive',
				},
			},
		});

		if (existingUser) {
			logger.warn(`Signup failed: User ${email} already exists.`);
			return res.status(409).json({ message: 'User already exists.' });
		}

		const company = await prisma.company.create({
			data: {
				name: companyName,
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

		logger.info(`User ${email} signed up successfully and created company ${company.id}.`);

		return res.status(201).json({
			token,
			user: serializeUser(user),
			company: serializeCompany(company, getCompanySettings(company.id)),
		});
	} catch (error) {
		logger.error(`Signup failed for ${req.body?.email}: ${error.message}`);
		return res.status(500).json({ message: 'Signup failed.' });
	}
};

const login = async (req, res) => {
	try {
		const email = normalizeEmail(req.body?.email);
		const password = String(req.body?.password || '');

		if (!email || !password) {
			logger.warn('Login failed: Email and password are required.');
			return res.status(400).json({ message: 'Email and password are required.' });
		}

		const user = await prisma.user.findFirst({
			where: {
				email: {
					equals: email,
					mode: 'insensitive',
				},
			},
			include: { company: true },
		});

		if (!user) {
			logger.warn(`Login failed: Invalid credentials for ${email}`);
			return res.status(401).json({ message: 'Invalid credentials.' });
		}

		const isPasswordValid = await verifyPassword(user, password);

		if (!isPasswordValid) {
			logger.warn(`Login failed: Invalid password for ${email}`);
			return res.status(401).json({ message: 'Invalid credentials.' });
		}

		const token = jwt.sign(
			{ userId: user.id, role: user.role, companyId: user.company_id },
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRES_IN }
		);

		logger.info(`User ${email} logged in successfully.`);

		return res.status(200).json({
			token,
			user: serializeUser(user),
			company: serializeCompany(user.company, getCompanySettings(user.company.id)),
		});
	} catch (error) {
		logger.error(`Login failed for ${req.body?.email}: ${error.message}`);
		return res.status(500).json({ message: 'Login failed.' });
	}
};

const forgotPassword = async (req, res) => {
	try {
		const email = normalizeEmail(req.body?.email);

		const user = await prisma.user.findFirst({
			where: {
				email: {
					equals: email,
					mode: 'insensitive',
				},
			},
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
		logger.error(`Forgot password failed for ${req.body?.email}: ${error.message}`);
		return res.status(500).json({ message: 'Forgot password failed.' });
	}
};

const resetPassword = async (req, res) => {
	try {
		const token = req.body?.token;
		const newPassword = req.body?.newPassword || req.body?.password;

		const user = await prisma.user.findFirst({
			where: {
				reset_token: token,
				reset_token_expiry: {
					gt: new Date(),
				},
			},
		});

		if (!user) {
			logger.warn(`Reset password failed: Invalid or expired token`);
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

		logger.info(`User ${user.email} reset their password successfully.`);
		return res.status(200).json({ message: 'Password reset successfully.' });
	} catch (error) {
		logger.error(`Reset password failed: ${error.message}`);
		return res.status(500).json({ message: 'Reset password failed.' });
	}
};

module.exports = {
	signup,
	login,
	forgotPassword,
	resetPassword,
};
