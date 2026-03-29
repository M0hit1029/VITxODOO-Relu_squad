const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	secure: false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

const sendEmail = async ({ to, subject, html }) => {
	return transporter.sendMail({
		from: process.env.SMTP_USER,
		to,
		subject,
		html,
	});
};

const sendPasswordEmail = async (email, password) => {
	const html = `<div><h2>Your Account Password</h2><p>Your generated password is: <strong>${password}</strong></p></div>`;
	return sendEmail({
		to: email,
		subject: 'Your Account Password',
		html,
	});
};

const sendResetEmail = async (email, resetLink) => {
	const html = `<div><h2>Reset Password</h2><p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p></div>`;
	return sendEmail({
		to: email,
		subject: 'Reset Your Password',
		html,
	});
};

const sendApprovalNotification = async (email, expenseName, action) => {
	const html = `<div><h2>Expense ${action}</h2><p>Your expense <strong>${expenseName}</strong> has been ${action}.</p></div>`;
	return sendEmail({
		to: email,
		subject: `Expense ${action}`,
		html,
	});
};

module.exports = {
	sendEmail,
	sendPasswordEmail,
	sendResetEmail,
	sendApprovalNotification,
};
