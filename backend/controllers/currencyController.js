const currencyService = require('../services/currencyService');

const getCountries = async (req, res) => {
	try {
		const data = await currencyService.getCountriesAndCurrencies();
		return res.status(200).json(data);
	} catch (error) {
		return res.status(500).json({ error: 'Failed to fetch countries.' });
	}
};

const convert = async (req, res) => {
	try {
		const { from, to, amount } = req.query;

		if (!from || !to || !amount) {
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
			return res.status(503).json({ error: 'Currency conversion unavailable' });
		}

		return res.status(500).json({ error: 'Conversion failed' });
	}
};

module.exports = {
	getCountries,
	convert,
};
