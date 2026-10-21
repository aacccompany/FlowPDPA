import { storage, type StoredAuth } from '@/utils/storage'
import { API_ENDPOINTS } from './endpoints'
import type { ApiError, ApiResponse, RefreshTokenResponse, RequestConfig } from './types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')
const GET_CACHE_PREFIX = 'flowpdpa:get-cache:v2:'
const GET_CACHE_TTL_MS = 2 * 60 * 1000

type CachedGetResponse = {
  savedAt: number
  response: ApiResponse<unknown>
}

const getCacheKey = (endpoint: string, userEmail?: string) =>
  `${GET_CACHE_PREFIX}${userEmail || 'public'}:${endpoint}`

const readCachedGet = <T>(key: string): ApiResponse<T> | null => {
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    const cached = JSON.parse(raw) as CachedGetResponse
    if (Date.now() - cached.savedAt > GET_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(key)
      return null
    }
    return cached.response as ApiResponse<T>
  } catch {
    window.sessionStorage.removeItem(key)
    return null
  }
}

const writeCachedGet = <T>(key: string, response: ApiResponse<T>) => {
  if (!response.success) return response
  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        response: response as ApiResponse<unknown>,
      } satisfies CachedGetResponse),
    )
  } catch {
    // Browsers may reject storage in private mode; network data still works.
  }
  return response
}

const clearAuthenticatedGetCache = () => {
  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index)
      if (key?.startsWith(GET_CACHE_PREFIX)) window.sessionStorage.removeItem(key)
    }
  } catch {
    // Cache invalidation is best effort and must never block a mutation.
  }
}

export const peekApiCache = <T>(endpoint: string): ApiResponse<T> | null => {
  const auth = storage.auth.get()
  return readCachedGet<T>(getCacheKey(endpoint, auth?.email))
}

export type DownloadedFile = { blob: Blob; filename: string }

export const apiDownload = async (
  endpoint: string,
  retryAuth = true,
): Promise<ApiResponse<DownloadedFile>> => {
  if (!API_BASE_URL) {
    return { success: false, error: { code: 'API_NOT_CONFIGURED', message: 'VITE_API_BASE_URL is not configured' } }
  }
  const auth = storage.auth.get()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {},
  }).catch(() => null)
  if (!response) {
    return { success: false, error: { code: 'NETWORK_ERROR', message: 'Network error occurred' } }
  }
  if (response.status === 401 && retryAuth && auth?.refreshToken) {
    const token = await refreshAccessToken()
    if (token) return apiDownload(endpoint, false)
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => undefined)
    return { success: false, error: parseError(payload, response.status) }
  }
  const disposition = response.headers.get('content-disposition') ?? ''
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  const filename = encoded ? decodeURIComponent(encoded) : plain ?? 'download'
  return { success: true, data: { blob: await response.blob(), filename } }
}

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
      : typeof body.detail === 'string'
        ? body.detail
      : typeof body.error === 'string'
        ? body.error
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
    cache = true,
  } = config
  const isMultipart = body instanceof FormData
  const auth = authenticated ? storage.auth.get() : null
  const cacheKey = method === 'GET' && cache
    ? getCacheKey(endpoint, authenticated ? auth?.email : undefined)
    : null
  if (cacheKey) {
    const cached = readCachedGet<T>(cacheKey)
    if (cached) return cached
  } else if (method !== 'GET') {
    clearAuthenticatedGetCache()
  }
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
        const result: ApiResponse<T> = {
          success: true,
          data: payload as T,
          message: typeof payload.message === 'string' ? payload.message : undefined,
        }
        return cacheKey ? writeCachedGet(cacheKey, result) : result
      }
      const result = payload as ApiResponse<T>
      return cacheKey ? writeCachedGet(cacheKey, result) : result
    }
    const result: ApiResponse<T> = { success: true, data: payload as T }
    return cacheKey ? writeCachedGet(cacheKey, result) : result
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
