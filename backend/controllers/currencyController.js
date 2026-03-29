const currencyService = require('../services/currencyService');
const logger = require('../utils/logger');

const getCountries = async (req, res) => {
	try {
		const data = await currencyService.getCountriesAndCurrencies();
		return res.status(200).json(data);
	} catch (error) {
		logger.error(`Failed to fetch countries details: ${error.message}`);
		return res.status(500).json({ error: 'Failed to fetch countries.' });
	}
};

const convert = async (req, res) => {
	try {
		const { from, to, amount } = req.query;

		if (!from || !to || !amount) {
			logger.warn('Currency conversion failed: Missing from, to, or amount params');
			return res.status(400).json({ error: 'from, to and amount are required' });
		}

		const converted = await currencyService.convertCurrency(amount, from, to);

		return res.status(200).json({
			from,
			to,
			amount: parseFloat(amount),
			converted,
		});
	} catch (error) {
		if (error.message === 'CONVERSION_FAILED') {
			logger.warn(`Currency conversion unavailable from '${req.query?.from}' to '${req.query?.to}'`);
			return res.status(503).json({ error: 'Currency conversion unavailable' });
		}

		logger.error(`Currency conversion failed unexpectedly: ${error.message}`);
		return res.status(500).json({ error: 'Conversion failed' });
	}
};

module.exports = {
	getCountries,
	convert,
};
