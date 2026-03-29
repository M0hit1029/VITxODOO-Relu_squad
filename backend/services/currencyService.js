const logger = require('../utils/logger');

const getCountriesAndCurrencies = async () => {
	try {
		const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies,flag,cca2');
		const data = await response.json();

		return data
			.filter((item) => item && item.name && item.name.common && item.currencies)
			.map((item) => {
				const currencyCode = Object.keys(item.currencies || {})[0];

				return currencyCode
					? {
							name: item.name.common,
							currencyCode,
							flag: item.flag || '',
							cca2: item.cca2 || '',
					  }
					: null;
			})
			.filter(Boolean)
			.sort((a, b) => a.name.localeCompare(b.name));
	} catch (error) {
		logger.error(`Failed to fetch countries details from external API: ${error.message}`);
		throw error;
	}
};

const convertCurrency = async (amount, fromCurrency, toCurrency) => {
	const numericAmount = parseFloat(amount);

	if (fromCurrency === toCurrency) {
		return parseFloat(numericAmount);
	}

	try {
		const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
		const data = await response.json();
		const rate = data.rates?.[toCurrency];

		if (!rate) {
			logger.warn(`Currency conversion missing rate for ${fromCurrency} -> ${toCurrency}`);
			throw new Error('CONVERSION_FAILED');
		}

		logger.info(`Currency converted ${fromCurrency} -> ${toCurrency} successfully`);
		return parseFloat((numericAmount * rate).toFixed(2));
	} catch (error) {
		logger.error(`Exception during currency conversion from ${fromCurrency}: ${error.message}`);
		throw new Error('CONVERSION_FAILED');
	}
};

module.exports = {
	getCountriesAndCurrencies,
	convertCurrency,
};
