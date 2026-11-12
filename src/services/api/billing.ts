import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export type BillingPlan = "business";
export type BillingCycle = "monthly";

export interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
  plan: BillingPlan;
  billingCycle: BillingCycle;
}

export type ConsentLogAddon = 500 | 2000 | 5000;

export interface AddonCheckoutSession {
  sessionId: string;
  checkoutUrl: string;
  logs: ConsentLogAddon;
  billingCycle: "monthly";
}

export interface SubscriptionSummary {
  id: string;
  policyType?: string;
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
  policyType?: string | null;
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
  createAddonCheckout: (logs: ConsentLogAddon) =>
    apiRequest<AddonCheckoutSession>(API_ENDPOINTS.billing.addonCheckoutSessions, {
      method: "POST",
      body: { logs },
    }),
  verifyCheckout: (sessionId: string) =>
    apiRequest<CheckoutVerification>(
      API_ENDPOINTS.billing.checkoutSession(sessionId),
    ),
  subscriptions: () =>
    apiRequest<SubscriptionSummary[]>(API_ENDPOINTS.billing.subscriptions),
  history: () =>
    apiRequest<MerchantBillingHistory>(API_ENDPOINTS.billing.history, { cache: false }),
  cancelSubscription: (subscriptionId: string) =>
    apiRequest<SubscriptionSummary>(
      API_ENDPOINTS.billing.cancelSubscription(subscriptionId),
      { method: "POST", body: { atPeriodEnd: true } },
    ),
};
