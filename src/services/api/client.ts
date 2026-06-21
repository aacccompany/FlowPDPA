import { storage, type StoredAuth } from '@/utils/storage'
import { API_ENDPOINTS } from './endpoints'
import type { ApiError, ApiResponse, RefreshTokenResponse, RequestConfig } from './types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')

const parseError = (payload: unknown, status: number): ApiError => {
  const body = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  const detail = body.detail && typeof body.detail === 'object'
    ? body.detail as Record<string, unknown>
    : body
  const nested = detail.error && typeof detail.error === 'object'
    ? detail.error as Record<string, unknown>
    : body.error && typeof body.error === 'object'
      ? body.error as Record<string, unknown>
      : detail

  return {
    code: typeof nested.code === 'string' ? nested.code : `HTTP_${status}`,
    message: typeof nested.message === 'string'
      ? nested.message
      : typeof body.message === 'string'
        ? body.message
        : `Request failed with status ${status}`,
    details: nested.details ?? nested,
    status,
  }
}

const saveRotatedTokens = (current: StoredAuth, tokens: RefreshTokenResponse) => {
  storage.auth.set({
    ...current,
    token: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  })
}

let refreshPromise: Promise<string | null> | null = null

export const refreshAccessToken = async (): Promise<string | null> => {
  const current = storage.auth.get()
  if (!API_BASE_URL || !current?.refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}${API_ENDPOINTS.auth.refreshToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: current.refreshToken }),
    })
      .then(async response => {
        if (!response.ok) return null
        const tokens = await response.json() as RefreshTokenResponse
        saveRotatedTokens(current, tokens)
        return tokens.access_token
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export const apiRequest = async <T = unknown>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<ApiResponse<T>> => {
  if (!API_BASE_URL) {
    return {
      success: false,
      error: { code: 'API_NOT_CONFIGURED', message: 'VITE_API_BASE_URL is not configured' },
    }
  }

  const {
    method = 'GET',
    headers: customHeaders = {},
    body,
    timeout = 30000,
    authenticated = true,
    retryAuth = true,
  } = config
  const isMultipart = body instanceof FormData
  const auth = authenticated ? storage.auth.get() : null
  const headers: Record<string, string> = {
    ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
    ...customHeaders,
  }
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: method === 'GET' || body === undefined
        ? undefined
        : isMultipart ? body : JSON.stringify(body),
      signal: controller.signal,
    })
    window.clearTimeout(timeoutId)

    if (response.status === 401 && authenticated && retryAuth && auth) {
      if (auth.refreshToken) {
        const token = await refreshAccessToken()
        if (token) return apiRequest<T>(endpoint, { ...config, retryAuth: false })
      }
      storage.auth.clear()
    }

    const payload = response.status === 204
      ? undefined
      : await response.json().catch(() => undefined)

    if (!response.ok) return { success: false, error: parseError(payload, response.status) }

    if (payload && typeof payload === 'object' && typeof payload.success === 'boolean') {
      if (payload.success && !('data' in payload)) {
        return {
          success: true,
          data: payload as T,
          message: typeof payload.message === 'string' ? payload.message : undefined,
        }
      }
      return payload as ApiResponse<T>
    }
    return { success: true, data: payload as T }
  } catch (error) {
    window.clearTimeout(timeoutId)
    const aborted = error instanceof DOMException && error.name === 'AbortError'
    return {
      success: false,
      error: {
        code: aborted ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: aborted
          ? 'Request timed out'
          : error instanceof Error ? error.message : 'Network error occurred',
      },
    }
  }
}
