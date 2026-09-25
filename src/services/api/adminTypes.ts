export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  pages?: number;
}

export type AdminMerchantStatus =
  "active" | "pending" | "suspended" | "inactive";
export type AdminLegalStatus = "active" | "suspended" | "inactive";
export type AdminPolicyStatus =
  | "draft"
  | "active"
  | "archived"
  | "pending_review"
  | "approved"
  | "rejected"
  | "edited";

export interface AdminSubscription {
  id: string;
  merchantId: string;
  merchantName: string | null;
  merchantEmail: string | null;
  policyType: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string | null;
  plan?: string | null;
  billingCycle?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
}

export interface AdminPayment {
  id: string;
  merchantId: string;
  merchantName: string | null;
  merchantEmail: string | null;
  stripeInvoiceId: string | null;
  policyType: string | null;
  amountPaid: number;
  currency: string;
  gateway: "stripe";
  status: string;
  paidAt: string | null;
  createdAt: string | null;
  plan?: string | null;
  billingCycle?: string | null;
  stripeSubscriptionId?: string | null;
}

export interface AdminPaymentDetail extends AdminPayment {
  invoiceNumber: string | null;
  customerEmail: string | null;
  customerName: string | null;
  stripeCustomerId: string | null;
  collectionMethod: string | null;
  subtotal: number;
  total: number;
  amountDue: number;
  amountRemaining: number;
  periodStart: string | null;
  periodEnd: string | null;
  dueDate: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  description: string | null;
  lines: Array<{
    id: string;
    description: string | null;
    quantity: number | null;
    amount: number;
    currency: string;
    periodStart: string | null;
    periodEnd: string | null;
  }>;
}

export interface AdminPolicy {
  id: string;
  slug: string;
  merchantId: string;
  merchantName: string | null;
  merchantEmail: string | null;
  websiteName: string;
  type: string;
  language: string;
  status: AdminPolicyStatus;
  version: number;
  assignedLegalUserId: string | null;
  approvalDeadline: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminPolicyDetail extends AdminPolicy {
  formData: Record<string, unknown>;
  assignmentNote: string | null;
  reviewComment: string | null;
  contentTh: string | null;
  contentEn: string | null;
}

export interface AdminMerchant {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  status: AdminMerchantStatus;
  policyCount: number;
  activeSubscriptions: number;
  createdAt: string | null;
  lastLoginAt: string | null;
}

export interface AdminMerchantDetail {
  id: string;
  name: string;
  email: string;
  status: AdminMerchantStatus;
  profile: {
    companyName: string | null;
    phone: string | null;
    website: string | null;
  };
  subscriptions: AdminSubscription[];
  paymentHistory: AdminPayment[];
  policies: AdminPolicy[];
  createdAt: string | null;
  lastLoginAt?: string | null;
  plan?: string | null;
}

export interface AdminMerchantCreate {
  name: string;
  email: string;
  password: string;
  companyName?: string;
  phone?: string;
  website?: string;
  status: AdminMerchantStatus;
  plan: string;
}

export interface AdminMerchantUpdate {
  name?: string;
  email?: string;
  companyName?: string;
  phone?: string;
  website?: string;
  status?: AdminMerchantStatus;
  plan?: string;
  password?: string;
}

export interface AdminErrorLog {
  id: string;
  level: "info" | "warning" | "error" | "critical";
  service: string;
  message: string;
  merchantId: string | null;
  context?: Record<string, unknown> | null;
  createdAt: string | null;
}

export interface AdminMerchantActivity {
  id: string;
  kind: "policy" | "consent";
  type: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  policyId: string;
  policyName: string;
  policySlug: string;
  relatedType: string;
  relatedField: string | null;
  description: string;
  evidence: Record<string, unknown>;
  createdAt: string | null;
}

export interface AdminAuditLog {
  id: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: "read" | "create" | "update" | "delete";
  method: string;
  path: string;
  statusCode: number;
  ipAddress: string | null;
  userAgent: string | null;
  durationMs: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string | null;
}

export interface AdminLegalUser {
  id: string;
  name: string;
  email: string;
  status: AdminLegalStatus;
  role: string;
  roleLevel?: string | null;
  phone?: string | null;
  pendingReviews: number;
  approvedCount: number;
  rejectedCount: number;
  editedCount: number;
  createdAt: string | null;
}

export interface AdminLegalWorkload {
  legalUserId: string;
  name: string;
  pending: number;
  overdue: number;
  approvedThisMonth: number;
  averageReviewHours: number;
}

export interface AdminLegalReview {
  reviewId: string;
  policyId: string;
  policySlug: string;
  websiteName: string;
  legalUserId: string | null;
  legalUserEmail: string;
  status: "approved" | "rejected" | "edited";
  comment: string | null;
  reviewedAt: string | null;
}

export interface AdminOverview {
  kpi: {
    activeMerchants: number;
    activeSubscriptions: number;
    totalRevenue: number;
    pendingPayments: number;
    pendingLegalReviews: number;
    unassignedLegalReviews: number;
    activeErrors: number;
  };
  policyStatus: Record<string, number>;
  recentPayments: AdminPayment[];
  recentErrors: AdminErrorLog[];
}

export interface AdminAnalytics {
  revenue: {
    total: number;
    currentMonth: number;
    currencyUnit: string;
    byPolicyType: Record<string, number>;
  };
  merchantGrowth: {
    monthOverMonthPercent: number;
    newThisMonth: number;
    newPreviousMonth: number;
    churnedSubscriptionsThisMonth: number;
  };
  policies: {
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
  topMerchants: Array<{
    merchantId: string;
    name: string;
    email: string;
    revenue: number;
  }>;
  atRiskSubscriptions: AdminSubscription[];
}
