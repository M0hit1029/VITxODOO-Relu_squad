const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../src/config/upload');
const {
	getExpenses,
	getExpense,
	createExpense,
	updateExpense,
	submitExpense,
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
router.get('/:id/logs', getLogs);
router.post('/upload-receipt', upload.single('receipt'), uploadReceipt);

module.exports = router;
