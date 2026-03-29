const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const { getCountries, convert } = require('../controllers/currencyController');

const router = express.Router();

router.get('/countries', getCountries);
router.get('/convert', verifyToken, convert);

module.exports = router;
