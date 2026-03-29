const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleGuard');
const {
	getUsers,
	createUser,
	updateUser,
	deleteUser,
	sendPassword,
} = require('../controllers/userController');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/send-password', sendPassword);

module.exports = router;
