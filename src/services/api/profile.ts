import { apiRequest } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { ChangePasswordPayload, ChangePasswordResult, ProfileUpdatePayload, UserProfile } from './types'

export const profileApi = {
  get: () => apiRequest<UserProfile>(API_ENDPOINTS.profile.root),
  update: (data: ProfileUpdatePayload) =>
    apiRequest<UserProfile>(API_ENDPOINTS.profile.root, { method: 'PUT', body: data }),
  changePassword: (data: ChangePasswordPayload) =>
    apiRequest<ChangePasswordResult>(API_ENDPOINTS.profile.changePassword, { method: 'POST', body: data }),
}
