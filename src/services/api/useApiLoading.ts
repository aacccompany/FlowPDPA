import { useState } from 'react'
import type { ApiError, ApiResponse } from './types'

export const useApiLoading = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const withLoading = async <T>(apiCall: () => Promise<ApiResponse<T>>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await apiCall()
      if (!result.success) setError(result.error ?? null)
      return result
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, error, withLoading }
}
