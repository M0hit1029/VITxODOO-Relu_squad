import { useEffect, useState } from 'react'
import { convertCurrency, getCountries } from '@/services/currencyService'

export function useCurrency(from, to, amount) {
  const [countries, setCountries] = useState([])
  const [convertedAmount, setConvertedAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    getCountries()
      .then((result) => {
        if (isMounted) setCountries(result)
      })
      .catch(() => {
        if (isMounted) setCountries([])
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    if (!from || !to || !amount) {
      setConvertedAmount(0)
      return undefined
    }
    setIsLoading(true)
    setError('')

    convertCurrency(from, to, Number(amount))
      .then((value) => {
        if (isMounted) setConvertedAmount(value)
      })
      .catch(() => {
        if (isMounted) setError('Conversion service is temporarily unavailable.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [amount, from, to])

  return { countries, convertedAmount, isLoading, error }
}
