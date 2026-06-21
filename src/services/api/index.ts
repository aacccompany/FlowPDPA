import { authApi } from './auth'
import { dashboardApi } from './dashboard'
import { policiesApi } from './policies'
import { profileApi } from './profile'
import { uploadFile } from './upload'
import { legalApi } from './legal'
import { adminApi } from './admin'

export const api = {
  auth: authApi,
  profile: profileApi,
  policies: policiesApi,
  dashboard: dashboardApi,
  upload: uploadFile,
  legal: legalApi,
  admin: adminApi,
}

export { apiRequest } from './client'
export { API_ENDPOINTS } from './endpoints'
export { useApiLoading } from './useApiLoading'
export type * from './types'
export type * from './policyTypes'
export type * from './adminTypes'

export default api
