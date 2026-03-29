const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const currencyRoutes = require('./currencyRoutes');
const expenseRoutes = require('./expenseRoutes');
const approvalRoutes = require('./approvalRoutes');
const ruleRoutes = require('./ruleRoutes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ ok: true }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/currency', currencyRoutes);
router.use('/expenses', expenseRoutes);
router.use('/approvals', approvalRoutes);
router.use('/rules', ruleRoutes);

module.exports = router;
