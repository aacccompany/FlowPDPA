import { storage } from '@/utils/storage'
import { apiRequest, refreshAccessToken } from './client'
import { API_ENDPOINTS } from './endpoints'
import type {
  ApiUser,
  AuthPayload,
  OtpVerified,
  RegistrationStarted,
  PrivacyNoticeStatus,
} from './types'

const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api').replace(/\/$/, '')

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phone?: string
  company?: string
}

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiRequest<AuthPayload>(API_ENDPOINTS.auth.login, {
      method: 'POST', body: data, authenticated: false,
    }),
  googleOAuth: {
    startUrl: (returnTo = '/dashboard') =>
      `${API_BASE_URL}${API_ENDPOINTS.auth.googleOAuthStart}?returnTo=${encodeURIComponent(returnTo)}`,
    exchange: (code: string) =>
      apiRequest<AuthPayload>(API_ENDPOINTS.auth.googleOAuthExchange, {
        method: 'POST', body: { code }, authenticated: false,
      }),
  },
  register: {
    initiate: (data: RegisterRequest) =>
      apiRequest<RegistrationStarted>(API_ENDPOINTS.auth.register, {
        method: 'POST', body: data, authenticated: false,
      }),
    verify: (data: { email: string; otp: string }) =>
      apiRequest<OtpVerified>(API_ENDPOINTS.auth.verifyRegistration, {
        method: 'POST', body: data, authenticated: false,
      }),
    resendOtp: (data: { email: string }) =>
      apiRequest<{ expiresIn?: number; remainingResends?: number }>(
        API_ENDPOINTS.auth.resendRegistrationOtp,
        { method: 'POST', body: data, authenticated: false },
      ),
  },
  verify: () => apiRequest<{ valid: boolean; user: ApiUser }>(API_ENDPOINTS.auth.verifyToken),
  privacyNotice: {
    status: () => apiRequest<PrivacyNoticeStatus>(API_ENDPOINTS.auth.privacyNotice),
    accept: (version: string) => apiRequest<PrivacyNoticeStatus>(API_ENDPOINTS.auth.acceptPrivacyNotice, {
      method: 'POST', body: { version, acknowledged: true },
    }),
  },
  refreshToken: refreshAccessToken,
  passwordReset: {
    request: (data: { email: string }) =>
      apiRequest<{ expiresIn: number; canResendIn: number }>(API_ENDPOINTS.auth.requestPasswordReset, {
        method: 'POST', body: data, authenticated: false,
      }),
    confirm: (data: { email: string; otp: string; newPassword: string }) =>
      apiRequest<{ message: string }>(API_ENDPOINTS.auth.confirmPasswordReset, {
        method: 'POST', body: data, authenticated: false,
      }),
  },
  logout: async () => {
    try {
      await apiRequest<{ success: boolean }>(API_ENDPOINTS.auth.logout, { method: 'POST' })
    } finally {
      storage.auth.clear()
    }
  },
}
