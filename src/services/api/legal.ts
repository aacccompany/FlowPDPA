import type { SavedPolicy } from '@/utils/policyStorage'
import { apiRequest } from './client'
import { API_ENDPOINTS } from './endpoints'

export const legalApi = {
  listSubmissions: () => apiRequest<SavedPolicy[]>(API_ENDPOINTS.legal.submissions),
  getSubmission: (slug: string) => apiRequest<SavedPolicy>(API_ENDPOINTS.legal.submission(slug)),
  updateSubmission: (slug: string, data: unknown) =>
    apiRequest<SavedPolicy>(API_ENDPOINTS.legal.submission(slug), { method: 'PATCH', body: data }),
}
