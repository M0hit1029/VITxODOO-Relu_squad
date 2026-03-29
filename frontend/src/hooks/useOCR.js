import { useCallback, useState } from 'react'
import { scanReceipt } from '@/services/ocrService'

export function useOCR() {
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)

  const scan = useCallback(async (file) => {
    setIsScanning(true)
    setProgress(0)
    try {
      const response = await scanReceipt(file, setProgress)
      setResult(response)
      return response
    } finally {
      setIsScanning(false)
    }
  }, [])

  return {
    isScanning,
    progress,
    result,
    setResult,
    scan,
  }
}
