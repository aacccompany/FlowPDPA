import { apiRequest } from './client'
import { API_ENDPOINTS } from './endpoints'
import type {
  ChangeRequestStatus,
  LegalChangeRequestReview,
  LegalDashboard,
  LegalSubmissionPatch,
  PolicyChangeRequest,
  PolicyStatus,
  SavedPolicy,
} from './policyTypes'

export const legalApi = {
  dashboard: () => apiRequest<LegalDashboard>(API_ENDPOINTS.legal.dashboard),
  listSubmissions: (status?: Exclude<PolicyStatus, 'archived'>) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    return apiRequest<SavedPolicy[]>(`${API_ENDPOINTS.legal.submissions}${query}`)
  },
  getSubmission: (slug: string) => apiRequest<SavedPolicy>(API_ENDPOINTS.legal.submission(slug)),
  updateSubmission: (slug: string, data: LegalSubmissionPatch) =>
    apiRequest<SavedPolicy>(API_ENDPOINTS.legal.submission(slug), { method: 'PATCH', body: data }),
  listChangeRequests: (filters?: { status?: ChangeRequestStatus; policySlug?: string }) => {
    const query = new URLSearchParams()
    if (filters?.status) query.set('status', filters.status)
    if (filters?.policySlug) query.set('policySlug', filters.policySlug)
    const suffix = query.size ? `?${query.toString()}` : ''
    return apiRequest<PolicyChangeRequest[]>(`${API_ENDPOINTS.legal.changeRequests}${suffix}`)
  },
  getChangeRequest: (requestId: string) =>
    apiRequest<PolicyChangeRequest>(API_ENDPOINTS.legal.changeRequest(requestId)),
  reviewChangeRequest: (requestId: string, data: LegalChangeRequestReview) =>
    apiRequest<PolicyChangeRequest>(API_ENDPOINTS.legal.changeRequest(requestId), { method: 'PATCH', body: data }),
}
