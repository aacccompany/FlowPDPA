export interface ApiError {
  code: string
  message: string
  details?: unknown
  status?: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
  authenticated?: boolean
  retryAuth?: boolean
}

export interface ApiUser {
  id?: string
  email: string
  name: string
  role?: string
  plan?: string
  company?: string
  phone?: string
  email_verified?: boolean
  status?: string
}

export interface AuthPayload {
  user: ApiUser
  token?: string
  access_token?: string
  refresh_token?: string
  token_type?: string
  expires_in?: number
}

export interface RegistrationStarted {
  email?: string
  expiresIn?: number
  canResendIn?: number
  nextStep?: string
  user?: ApiUser
  token?: string
  access_token?: string
  refresh_token?: string
  expires_in?: number
}

export interface OtpVerified extends Partial<AuthPayload> {
  user: ApiUser
}

export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}
