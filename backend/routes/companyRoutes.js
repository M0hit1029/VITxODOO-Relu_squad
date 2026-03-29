const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleGuard');
const {
	getCompanyProfile,
	updateCompanyProfile,
} = require('../controllers/companyController');

const router = express.Router();

router.use(verifyToken);

router.get('/', getCompanyProfile);
router.put('/', requireRole('admin'), updateCompanyProfile);

module.exports = router;
