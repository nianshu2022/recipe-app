import { useState } from 'react'
import { fetchProductByBarcode, type OffResult } from '@/utils/externalApis'

interface UseBarcodeScannerOptions {
  onProductFound: (product: OffResult) => void
}

export function useBarcodeScanner({ onProductFound }: UseBarcodeScannerOptions) {
  const [showScanner, setShowScanner] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const handleScan = async (barcode: string) => {
    setShowScanner(false)
    setLookupLoading(true)
    setLookupError(null)

    const { data, error } = await fetchProductByBarcode(barcode)

    setLookupLoading(false)

    if (error) {
      setLookupError(error)
      return
    }

    if (data) {
      onProductFound(data)
    } else {
      setLookupError('未找到该条形码对应的产品')
    }
  }

  return {
    showScanner,
    setShowScanner,
    lookupLoading,
    lookupError,
    setLookupError,
    handleScan,
  }
}
