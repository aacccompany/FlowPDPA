import { apiRequest } from './client'
import { API_ENDPOINTS } from './endpoints'
import type {
  ArchivePolicyResult,
  ChangeRequestStatus,
  PolicyActivityLog,
  PolicyChangeRequest,
  PolicyChangeRequestCreate,
  PolicyQuestionnaire,
  SavedPolicy,
} from './policyTypes'

export const policiesApi = {
  list: () => apiRequest<SavedPolicy[]>(API_ENDPOINTS.policies.root),
  get: (id: string) => apiRequest<SavedPolicy>(API_ENDPOINTS.policies.byId(id)),
  create: (data: PolicyQuestionnaire) => apiRequest<SavedPolicy>(API_ENDPOINTS.policies.root, { method: 'POST', body: data, timeout: 120000 }),
  regenerate: (id: string, data: PolicyQuestionnaire) =>
    apiRequest<SavedPolicy>(API_ENDPOINTS.policies.byId(id), { method: 'PUT', body: data, timeout: 120000 }),
  archive: (id: string) => apiRequest<ArchivePolicyResult>(API_ENDPOINTS.policies.byId(id), { method: 'DELETE' }),
  createChangeRequest: (policyId: string, data: PolicyChangeRequestCreate) =>
    apiRequest<PolicyChangeRequest>(API_ENDPOINTS.policies.changeRequests(policyId), { method: 'POST', body: data }),
  listChangeRequests: (policyId: string, status?: ChangeRequestStatus) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    return apiRequest<PolicyChangeRequest[]>(`${API_ENDPOINTS.policies.changeRequests(policyId)}${query}`)
  },
  getChangeRequest: (policyId: string, requestId: string) =>
    apiRequest<PolicyChangeRequest>(API_ENDPOINTS.policies.changeRequest(policyId, requestId)),
  listActivityLogs: (policyId: string) =>
    apiRequest<PolicyActivityLog[]>(API_ENDPOINTS.policies.activityLogs(policyId)),
  recordPublicConsent: (slug: string) =>
    apiRequest<{ id: string; consentedAt: string }>(API_ENDPOINTS.policies.publicConsent(slug), {
      method: 'POST', body: { consentVersion: 'v1' }, authenticated: false,
    }),
  recordPublicAcknowledgement: (slug: string) =>
    apiRequest<{ id: string; acknowledgedAt: string }>(API_ENDPOINTS.policies.publicAcknowledgement(slug), {
      method: 'POST', body: { acknowledgementVersion: 'v1' }, authenticated: false,
    }),
  // Compatibility aliases for current callers.
  update: (id: string, data: PolicyQuestionnaire) => policiesApi.regenerate(id, data),
  delete: (id: string) => policiesApi.archive(id),
}
