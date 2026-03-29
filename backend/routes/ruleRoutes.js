const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleGuard');
const { getRules, createRule, updateRule, deleteRule } = require('../controllers/ruleController');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/', getRules);
router.post('/', createRule);
router.put('/:id', updateRule);
router.delete('/:id', deleteRule);

module.exports = router;
