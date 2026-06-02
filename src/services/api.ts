import { useState } from 'react'

// API Configuration - set to empty string to use mock mode
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Mock mode flag - when true, returns simulated responses
const USE_MOCK = !API_BASE_URL

// API Response Types
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

// Request configuration interface
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
}

// Default headers
const getHeaders = (isMultipart = false): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json',
  }

  // Add auth token if exists
  const token = localStorage.getItem('flowpdpa_auth')
  if (token) {
    try {
      const auth = JSON.parse(token)
      headers['Authorization'] = `Bearer ${auth.token}`
    } catch (e) {
      console.warn('Failed to parse auth token')
    }
  }

  return headers
}

// Mock response handlers
const mockHandlers: Record<string, (body?: any) => Promise<ApiResponse>> = {
  'POST:/auth/login': async (body: any) => ({
    success: true,
    data: {
      user: {
        email: body.email,
        name: 'Demo User',
        plan: 'Free'
      },
      token: 'mock-jwt-token-' + Date.now()
    }
  }),

  'POST:/auth/register/initiate': async (body: any) => ({
    success: true,
    data: {
      email: body.email,
      expiresIn: 300,
      canResendIn: 60
    }
  }),

  'POST:/auth/register/verify': async (body: any) => ({
    success: true,
    data: {
      user: {
        email: body.email,
        name: 'New User',
        plan: 'Free'
      },
      token: 'mock-verified-token-' + Date.now()
    }
  }),

  'POST:/auth/register/resend-otp': async () => ({
    success: true,
    data: {
      expiresIn: 300,
      canResendIn: 60
    }
  }),

  'POST:/auth/logout': async () => ({
    success: true
  }),

  'GET:/profile': async () => ({
    success: true,
    data: {
      name: 'Demo User',
      email: 'demo@example.com',
      phone: '',
      company: '',
      plan: 'Free'
    }
  }),

  'GET:/policies': async () => ({
    success: true,
    data: []
  }),

  'GET:/dashboard/stats': async () => ({
    success: true,
    data: {
      totalPolicies: 0,
      activePolicies: 0,
      draftPolicies: 0,
      recentActivity: []
    }
  })
}

// Centralized fetch function with error handling
const apiRequest = async <T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> => {
  // Use mock handler if available
  if (USE_MOCK) {
    const mockKey = `${config.method || 'GET'}:${endpoint}`
    const handler = mockHandlers[mockKey as keyof typeof mockHandlers]

    if (handler) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800))
      return await handler(config.body) as ApiResponse<T>
    }

    // Default mock response for unhandled endpoints
    return {
      success: true,
      data: {} as T
    }
  }

  // Real API call when backend is available
  const {
    method = 'GET',
    headers: customHeaders = {},
    body,
    timeout = 30000, // 30 seconds default timeout
  } = config

  const url = `${API_BASE_URL}${endpoint}`
  const requestHeaders = {
    ...getHeaders(config.method === 'POST' && body instanceof FormData),
    ...customHeaders
  }

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: method !== 'GET' ? body : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorData.message || `Request failed with status ${response.status}`,
          details: errorData,
        },
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error: any) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timed out',
        },
      }
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error occurred',
      },
    }
  }
}

// API Service methods
export const api = {
  // Auth endpoints
  auth: {
    login: (data: { email: string; password: string }) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: data,
      }),

    register: {
      initiate: (data: {
        name: string
        email: string
        password: string
        phone?: string
        company?: string
      }) =>
        apiRequest('/auth/register/initiate', {
          method: 'POST',
          body: data,
        }),

      verify: (data: { email: string; otp: string }) =>
        apiRequest('/auth/register/verify', {
          method: 'POST',
          body: data,
        }),

      resendOtp: (data: { email: string }) =>
        apiRequest('/auth/register/resend-otp', {
          method: 'POST',
          body: data,
        }),
    },

    logout: () =>
      apiRequest('/auth/logout', {
        method: 'POST',
      }),

    refreshToken: () =>
      apiRequest('/auth/refresh', {
        method: 'POST',
      }),
  },

  // User profile endpoints
  profile: {
    get: () =>
      apiRequest('/profile'),

    update: (data: Partial<{
      name: string
      email: string
      phone: string
      company: string
    }>) =>
      apiRequest('/profile', {
        method: 'PUT',
        body: data,
      }),
  },

  // Policy endpoints
  policies: {
    list: () =>
      apiRequest('/policies'),

    get: (id: string) =>
      apiRequest(`/policies/${id}`),

    create: (data: any) =>
      apiRequest('/policies', {
        method: 'POST',
        body: data,
      }),

    update: (id: string, data: any) =>
      apiRequest(`/policies/${id}`, {
        method: 'PUT',
        body: data,
      }),

    delete: (id: string) =>
      apiRequest(`/policies/${id}`, {
        method: 'DELETE',
      }),
  },

  // Dashboard endpoints
  dashboard: {
    getStats: () =>
      apiRequest('/dashboard/stats'),

    getRecentActivities: () =>
      apiRequest('/dashboard/activities'),
  },

  // File upload
  upload: (file: File, type: 'avatar' | 'document' | 'policy') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    return apiRequest('/upload', {
      method: 'POST',
      body: formData as any,
    })
  },
}

// Helper hook for loading states (can be used with React Query later)
export const useApiLoading = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiResponse['error'] | null>(null)

  const withLoading = async <T>(
    apiCall: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      if (!result.success && result.error) {
        setError(result.error)
      }
      return result
    } catch (err) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        },
      }
      setError(errorResponse.error)
      return errorResponse
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    withLoading,
  }
}

export default api