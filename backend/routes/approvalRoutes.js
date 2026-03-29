const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleGuard');
const {
	getPendingApprovals,
	approveExpense,
	rejectExpense,
} = require('../controllers/approvalController');

const router = express.Router();

router.use(verifyToken, requireRole('manager', 'admin'));

router.get('/pending', getPendingApprovals);
router.post('/:id/approve', approveExpense);
router.post('/:id/reject', rejectExpense);

module.exports = router;
