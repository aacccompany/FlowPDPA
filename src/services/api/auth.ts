import { storage } from '@/utils/storage'
import { apiRequest, refreshAccessToken } from './client'
import { API_ENDPOINTS } from './endpoints'
import type {
  ApiUser,
  AuthPayload,
  OtpVerified,
  RegistrationStarted,
} from './types'

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
  adminLogin: (data: { email: string; password: string }) =>
    apiRequest<AuthPayload>(API_ENDPOINTS.auth.adminLogin, {
      method: 'POST', body: data, authenticated: false,
    }),
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
  refreshToken: refreshAccessToken,
  logout: () => storage.auth.clear(),
}
