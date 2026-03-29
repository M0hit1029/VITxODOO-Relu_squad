import { BASE_COUNTRIES } from '@/lib/constants'

let countriesCache = null

const fallbackRates = {
  INR: { INR: 1, USD: 0.012, GBP: 0.0094, AED: 0.044, SGD: 0.016, EUR: 0.011, JPY: 1.78 },
  USD: { USD: 1, INR: 82.95, GBP: 0.78, AED: 3.67, SGD: 1.34, EUR: 0.92, JPY: 147.9 },
  GBP: { GBP: 1, INR: 106.45, USD: 1.28, AED: 4.7, SGD: 1.72, EUR: 1.17, JPY: 189.2 },
  AED: { AED: 1, INR: 22.59, USD: 0.27, GBP: 0.21, SGD: 0.37, EUR: 0.25, JPY: 40.2 },
  SGD: { SGD: 1, INR: 61.74, USD: 0.75, GBP: 0.58, AED: 2.74, EUR: 0.69, JPY: 110.1 },
  EUR: { EUR: 1, INR: 90.32, USD: 1.08, GBP: 0.85, AED: 3.97, SGD: 1.45, JPY: 161.3 },
  JPY: { JPY: 1, INR: 0.56, USD: 0.0068, GBP: 0.0053, AED: 0.025, SGD: 0.0091, EUR: 0.0062 },
}

function normalizeCountry(payload) {
  if (!payload?.currencies) return null
  const currencyCode = Object.keys(payload.currencies)[0]
  return {
    name: payload.name.common,
    currencyCode,
    flag: payload.flag ?? '',
    cca2: payload.cca2,
  }
}

export async function getCountries() {
  if (countriesCache) return countriesCache

  try {
    const response = await fetch(
      'https://restcountries.com/v3.1/all?fields=name,currencies,flag,cca2',
    )
    const countries = await response.json()
    countriesCache = countries
      .map(normalizeCountry)
      .filter(Boolean)
      .sort((left, right) => left.name.localeCompare(right.name))
    return countriesCache
  } catch {
    countriesCache = BASE_COUNTRIES
    return countriesCache
  }
}

export async function convertCurrency(from, to, amount) {
  if (!amount || Number.isNaN(Number(amount))) return 0
  if (from === to) return Number(amount)

  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`)
    const data = await response.json()
    return Number(amount) * Number(data.rates[to])
  } catch {
    const rate = fallbackRates[from]?.[to]
    return rate ? Number(amount) * rate : Number(amount)
  }
}
