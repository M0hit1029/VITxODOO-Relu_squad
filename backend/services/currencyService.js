const getCountriesAndCurrencies = async () => {
	const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
	const data = await response.json();

	return data
		.filter((item) => item && item.name && item.name.common && item.currencies)
		.flatMap((item) => {
			const currencyCodes = Object.keys(item.currencies || {});
			if (currencyCodes.length === 0) {
				return [];
			}

			return currencyCodes.map((code) => ({
				label: `${item.name.common} (${code})`,
				country: item.name.common,
				currency: code,
			}));
		})
		.sort((a, b) => a.label.localeCompare(b.label));
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
			throw new Error('CONVERSION_FAILED');
		}

		return parseFloat((numericAmount * rate).toFixed(2));
	} catch (error) {
		throw new Error('CONVERSION_FAILED');
	}
};

module.exports = {
	getCountriesAndCurrencies,
	convertCurrency,
};
