import { apiRequest } from './client'
import { API_ENDPOINTS } from './endpoints'
import type {
  AdminAnalytics, AdminErrorLog, AdminLegalReview, AdminLegalStatus, AdminLegalUser,
  AdminLegalWorkload, AdminMerchant, AdminMerchantStatus, AdminOverview, AdminPagination,
  AdminPayment, AdminPolicy, AdminPolicyDetail, AdminSubscription,
} from './adminTypes'

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)) })
  const value = search.toString()
  return value ? `?${value}` : ''
}

export const adminApi = {
  overview: () => apiRequest<AdminOverview>(API_ENDPOINTS.admin.overview),
  listMerchants: (params: { status?: string; search?: string; page?: number; limit?: number } = {}) =>
    apiRequest<{ merchants: AdminMerchant[]; pagination: AdminPagination }>(`${API_ENDPOINTS.admin.merchants}${query(params)}`),
  getMerchant: (id: string) => apiRequest<{ merchant: AdminMerchant & { subscriptions: AdminSubscription[]; paymentHistory: AdminPayment[]; policies: AdminPolicy[] } }>(API_ENDPOINTS.admin.merchant(id)),
  updateMerchantStatus: (id: string, status: AdminMerchantStatus) =>
    apiRequest<{ id: string; status: AdminMerchantStatus; updated: boolean }>(API_ENDPOINTS.admin.merchantStatus(id), { method: 'PUT', body: { status } }),
  listSubscriptions: (params: { status?: string; policyType?: string; page?: number; limit?: number } = {}) =>
    apiRequest<{ subscriptions: AdminSubscription[]; pagination: AdminPagination }>(`${API_ENDPOINTS.admin.subscriptions}${query(params)}`),
  listPayments: (params: { status?: string; page?: number; limit?: number } = {}) =>
    apiRequest<{ payments: AdminPayment[]; summary: { totalCollected: number; pending: number; failed: number }; pagination: AdminPagination }>(`${API_ENDPOINTS.admin.payments}${query(params)}`),
  listPolicies: (params: { status?: string; policyType?: string; merchantId?: string; search?: string; page?: number; limit?: number } = {}) =>
    apiRequest<{ policies: AdminPolicy[]; pagination: AdminPagination }>(`${API_ENDPOINTS.admin.policies}${query(params)}`),
  getPolicy: (id: string) => apiRequest<{ policy: AdminPolicyDetail }>(API_ENDPOINTS.admin.policy(id)),
  assignLegal: (policyId: string, legalUserId: string, note?: string) =>
    apiRequest<{ policyId: string; assignedLegalUserId: string; assignedAt: string }>(API_ENDPOINTS.admin.assignLegal(policyId), { method: 'PUT', body: { legalUserId, note } }),
  listLogs: (params: { level?: string; service?: string; page?: number; limit?: number } = {}) =>
    apiRequest<{ logs: AdminErrorLog[]; summary: Record<string, number>; pagination: AdminPagination }>(`${API_ENDPOINTS.admin.logs}${query(params)}`),
  analytics: () => apiRequest<AdminAnalytics>(API_ENDPOINTS.admin.analytics),
  listLegalUsers: (params: { status?: string; search?: string } = {}) =>
    apiRequest<{ legalUsers: AdminLegalUser[] }>(`${API_ENDPOINTS.admin.legalUsers}${query(params)}`),
  createLegalUser: (data: { name: string; email: string; password: string; phone?: string; status: AdminLegalStatus }) =>
    apiRequest<Pick<AdminLegalUser, 'id' | 'name' | 'email' | 'status' | 'role'>>(API_ENDPOINTS.admin.legalUsers, { method: 'POST', body: data }),
  updateLegalUser: (id: string, data: { name?: string; email?: string; phone?: string; roleLevel?: string }) =>
    apiRequest<AdminLegalUser>(API_ENDPOINTS.admin.legalUser(id), { method: 'PUT', body: data }),
  updateLegalUserStatus: (id: string, status: AdminLegalStatus) =>
    apiRequest<{ id: string; status: AdminLegalStatus }>(API_ENDPOINTS.admin.legalUserStatus(id), { method: 'PUT', body: { status } }),
  legalWorkload: () => apiRequest<{ summary: { totalLegalUsers: number; activeLegalUsers: number; totalPendingReviews: number; overdueReviews: number }; workload: AdminLegalWorkload[] }>(API_ENDPOINTS.admin.legalWorkload),
  legalReviews: (params: { legalUserId?: string; status?: string; page?: number; limit?: number } = {}) =>
    apiRequest<{ reviews: AdminLegalReview[]; pagination: AdminPagination }>(`${API_ENDPOINTS.admin.legalReviews}${query(params)}`),
}
