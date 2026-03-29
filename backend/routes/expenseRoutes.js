const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleGuard');
const upload = require('../src/config/upload');
const {
	getExpenses,
	getExpense,
	createExpense,
	updateExpense,
	submitExpense,
	overrideExpenseStatus,
	getLogs,
	uploadReceipt,
} = require('../controllers/expenseController');

const router = express.Router();

router.use(verifyToken);

router.get('/', getExpenses);
router.post('/', upload.single('receipt'), createExpense);
router.get('/:id', getExpense);
router.put('/:id', upload.single('receipt'), updateExpense);
router.post('/:id/submit', submitExpense);
router.post('/:id/override', requireRole('admin'), overrideExpenseStatus);
router.get('/:id/logs', getLogs);
router.post('/upload-receipt', upload.single('receipt'), uploadReceipt);

module.exports = router;
