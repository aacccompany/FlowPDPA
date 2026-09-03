import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export type BillingPlan = "personal" | "business" | "enterprise";
export type BillingCycle = "monthly" | "annual";

export interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
  plan: BillingPlan;
  billingCycle: BillingCycle;
}

export interface SubscriptionSummary {
  id: string;
  status: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: string | null;
  currentPeriodEnd: string | null;
  plan?: BillingPlan | null;
  billingCycle?: BillingCycle | null;
  createdAt?: string | null;
}

export interface MerchantPayment {
  id: string;
  invoiceReference: string;
  amountPaid: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string | null;
}

export interface MerchantBillingHistory {
  subscriptions: SubscriptionSummary[];
  payments: MerchantPayment[];
}

export interface CheckoutVerification {
  sessionId: string;
  paymentStatus: string | null;
  status: string | null;
  subscriptionStatus: string | null;
  active: boolean;
}

export const billingApi = {
  createCheckout: (plan: BillingPlan, billingCycle: BillingCycle) =>
    apiRequest<CheckoutSession>(API_ENDPOINTS.billing.checkoutSessions, {
      method: "POST",
      body: { plan, billingCycle },
    }),
  verifyCheckout: (sessionId: string) =>
    apiRequest<CheckoutVerification>(
      API_ENDPOINTS.billing.checkoutSession(sessionId),
    ),
  subscriptions: () =>
    apiRequest<SubscriptionSummary[]>(API_ENDPOINTS.billing.subscriptions),
  history: () =>
    apiRequest<MerchantBillingHistory>(API_ENDPOINTS.billing.history),
  cancelSubscription: (subscriptionId: string) =>
    apiRequest<SubscriptionSummary>(
      API_ENDPOINTS.billing.cancelSubscription(subscriptionId),
      { method: "POST", body: { atPeriodEnd: true } },
    ),
};
