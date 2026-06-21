import { apiRequest } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { SavedPolicy } from '@/utils/policyStorage'

export const policiesApi = {
  list: () => apiRequest<SavedPolicy[]>(API_ENDPOINTS.policies.root),
  get: (id: string) => apiRequest<SavedPolicy>(API_ENDPOINTS.policies.byId(id)),
  create: (data: unknown) => apiRequest<SavedPolicy>(API_ENDPOINTS.policies.root, { method: 'POST', body: data }),
  update: (id: string, data: unknown) =>
    apiRequest(API_ENDPOINTS.policies.byId(id), { method: 'PUT', body: data }),
  delete: (id: string) => apiRequest(API_ENDPOINTS.policies.byId(id), { method: 'DELETE' }),
}
