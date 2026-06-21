import { apiRequest } from './client'
import { API_ENDPOINTS } from './endpoints'

export const profileApi = {
  get: () => apiRequest(API_ENDPOINTS.profile.root),
  update: (data: Record<string, unknown>) =>
    apiRequest(API_ENDPOINTS.profile.root, { method: 'PUT', body: data }),
}
