import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type {
  AdminAnalytics,
  AdminAuditLog,
  AdminErrorLog,
  AdminLegalReview,
  AdminLegalStatus,
  AdminLegalUser,
  AdminLegalWorkload,
  AdminMerchant,
  AdminMerchantActivity,
  AdminMerchantCreate,
  AdminMerchantDetail,
  AdminMerchantStatus,
  AdminMerchantUpdate,
  AdminOverview,
  AdminPagination,
  AdminPayment,
  AdminPolicy,
  AdminPolicyDetail,
  AdminSubscription,
} from "./adminTypes";
import type { AdminCompanyDocument } from "./companyDocuments";

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : "";
};

export const adminApi = {
  overview: () => apiRequest<AdminOverview>(API_ENDPOINTS.admin.overview),
  listMerchants: (
    params: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) =>
    apiRequest<{ merchants: AdminMerchant[]; pagination: AdminPagination }>(
      `${API_ENDPOINTS.admin.merchants}${query(params)}`,
    ),
  getMerchant: (id: string) =>
    apiRequest<{ merchant: AdminMerchantDetail }>(
      API_ENDPOINTS.admin.merchant(id),
    ),
  createMerchant: (data: AdminMerchantCreate) =>
    apiRequest<{ merchant: AdminMerchant }>(API_ENDPOINTS.admin.merchants, {
      method: "POST",
      body: data,
    }),
  updateMerchant: (id: string, data: AdminMerchantUpdate) =>
    apiRequest<{ merchant: AdminMerchant }>(API_ENDPOINTS.admin.merchant(id), {
      method: "PUT",
      body: data,
    }),
  updateMerchantStatus: (id: string, status: AdminMerchantStatus) =>
    apiRequest<{ id: string; status: AdminMerchantStatus; updated: boolean }>(
      API_ENDPOINTS.admin.merchantStatus(id),
      { method: "PUT", body: { status } },
    ),
  deleteMerchant: (id: string) =>
    apiRequest<{
      id: string;
      status: "inactive";
      deletedAt: string;
      archivedPolicyIds: string[];
    }>(API_ENDPOINTS.admin.merchant(id), { method: "DELETE" }),
  listSubscriptions: (
    params: {
      status?: string;
      policyType?: string;
      page?: number;
      limit?: number;
    } = {},
  ) =>
    apiRequest<{
      subscriptions: AdminSubscription[];
      pagination: AdminPagination;
    }>(`${API_ENDPOINTS.admin.subscriptions}${query(params)}`),
  listPayments: (
    params: { status?: string; page?: number; limit?: number } = {},
  ) =>
    apiRequest<{
      payments: AdminPayment[];
      summary: { totalCollected: number; pending: number; failed: number };
      pagination: AdminPagination;
    }>(`${API_ENDPOINTS.admin.payments}${query(params)}`),
  getPayment: (paymentId: string) =>
    apiRequest<{ payment: import("./adminTypes").AdminPaymentDetail }>(
      API_ENDPOINTS.admin.payment(paymentId),
    ),
  listPolicies: (
    params: {
      status?: string;
      policyType?: string;
      merchantId?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) =>
    apiRequest<{ policies: AdminPolicy[]; pagination: AdminPagination }>(
      `${API_ENDPOINTS.admin.policies}${query(params)}`,
    ),
  getPolicy: (id: string) =>
    apiRequest<{ policy: AdminPolicyDetail }>(API_ENDPOINTS.admin.policy(id)),
  assignLegal: (policyId: string, legalUserId: string, note?: string) =>
    apiRequest<{
      policyId: string;
      assignedLegalUserId: string;
      assignedAt: string;
    }>(API_ENDPOINTS.admin.assignLegal(policyId), {
      method: "PUT",
      body: { legalUserId, note },
    }),
  listLogs: (
    params: {
      level?: string;
      service?: string;
      page?: number;
      limit?: number;
    } = {},
  ) =>
    apiRequest<{
      logs: AdminErrorLog[];
      summary: Record<string, number>;
      pagination: AdminPagination;
    }>(`${API_ENDPOINTS.admin.logs}${query(params)}`),
  listActivityLogs: (
    params: {
      action?: string;
      method?: string;
      actor?: string;
      page?: number;
      limit?: number;
    } = {},
  ) =>
    apiRequest<{ logs: AdminAuditLog[]; pagination: AdminPagination }>(
      `${API_ENDPOINTS.admin.activityLogs}${query(params)}`,
    ),
  listMerchantActivity: (
    params: {
      type?: string;
      merchantId?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) =>
    apiRequest<{ logs: AdminMerchantActivity[]; pagination: AdminPagination }>(
      `${API_ENDPOINTS.admin.merchantActivity}${query(params)}`,
    ),
  analytics: () => apiRequest<AdminAnalytics>(API_ENDPOINTS.admin.analytics),
  listLegalUsers: (params: { status?: string; search?: string } = {}) =>
    apiRequest<{ legalUsers: AdminLegalUser[] }>(
      `${API_ENDPOINTS.admin.legalUsers}${query(params)}`,
    ),
  createLegalUser: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    status: AdminLegalStatus;
  }) =>
    apiRequest<
      Pick<AdminLegalUser, "id" | "name" | "email" | "status" | "role">
    >(API_ENDPOINTS.admin.legalUsers, { method: "POST", body: data }),
  updateLegalUser: (
    id: string,
    data: { name?: string; email?: string; phone?: string; roleLevel?: string },
  ) =>
    apiRequest<AdminLegalUser>(API_ENDPOINTS.admin.legalUser(id), {
      method: "PUT",
      body: data,
    }),
  updateLegalUserStatus: (id: string, status: AdminLegalStatus) =>
    apiRequest<{ id: string; status: AdminLegalStatus }>(
      API_ENDPOINTS.admin.legalUserStatus(id),
      { method: "PUT", body: { status } },
    ),
  deleteLegalUser: (id: string) =>
    apiRequest<{
      id: string;
      status: "inactive";
      deletedAt: string;
      reassignedPolicyIds: string[];
    }>(API_ENDPOINTS.admin.legalUser(id), { method: "DELETE" }),
  legalWorkload: () =>
    apiRequest<{
      summary: {
        totalLegalUsers: number;
        activeLegalUsers: number;
        totalPendingReviews: number;
        overdueReviews: number;
      };
      workload: AdminLegalWorkload[];
    }>(API_ENDPOINTS.admin.legalWorkload),
  legalReviews: (
    params: {
      legalUserId?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ) =>
    apiRequest<{ reviews: AdminLegalReview[]; pagination: AdminPagination }>(
      `${API_ENDPOINTS.admin.legalReviews}${query(params)}`,
    ),
  listCompanyDocuments: (params: {
    query?: string; merchantId?: string; validationStatus?: string;
    archiveStatus?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number;
  } = {}) => apiRequest<{ items: AdminCompanyDocument[]; pagination: AdminPagination & { totalPages: number } }>(
    `${API_ENDPOINTS.admin.companyDocuments}${query(params)}`,
  ),
  getCompanyDocument: (documentId: string) =>
    apiRequest<AdminCompanyDocument>(API_ENDPOINTS.admin.companyDocument(documentId)),
  getCompanyDocumentViewUrl: (documentId: string) =>
    apiRequest<{ url: string; expiresIn: number }>(API_ENDPOINTS.admin.companyDocumentViewUrl(documentId)),
  approveCompanyDocument: (documentId: string, note = "") =>
    apiRequest<AdminCompanyDocument>(API_ENDPOINTS.admin.approveCompanyDocument(documentId), { method: "POST", body: { note } }),
  rejectCompanyDocument: (documentId: string, reason: string, note = "") =>
    apiRequest<AdminCompanyDocument>(API_ENDPOINTS.admin.rejectCompanyDocument(documentId), { method: "POST", body: { reason, note } }),
  retryCompanyDocumentArchive: (documentId: string) =>
    apiRequest<{ documentId: string; archiveStatus: string }>(API_ENDPOINTS.admin.retryCompanyDocumentArchive(documentId), { method: "POST" }),
};
