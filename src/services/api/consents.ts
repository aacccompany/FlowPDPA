import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export interface ConsentPurpose {
  id: string;
  label: string;
  description?: string;
  required: boolean;
}
export type ConsentFieldType =
  "text" | "email" | "textarea" | "checkbox" | "select";
export interface ConsentField {
  id: string;
  type: ConsentFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options: string[];
}
export interface ConsentForm {
  id: string;
  policyId: string;
  templateId?: string;
  name: string;
  description?: string;
  purposes: ConsentPurpose[];
  fields: ConsentField[];
  status: string;
  version: number;
  publicToken: string;
  createdAt: string;
}
export interface ConsentRecord {
  id: string;
  formId: string;
  subjectName?: string;
  subjectEmail: string;
  subjectReference?: string;
  status: "active" | "rejected" | "withdrawn";
  choices: Record<string, boolean>;
  grantedAt?: string;
  withdrawnAt?: string;
  createdAt: string;
}
export interface PublicConsentForm {
  token: string;
  name: string;
  description?: string;
  purposes: ConsentPurpose[];
  fields: ConsentField[];
  version: number;
}
export type ConsentActivityType =
  "consent_granted" | "consent_rejected" | "consent_withdrawn";
export interface ConsentActivityLog {
  id: string;
  type: ConsentActivityType;
  recordId: string;
  formId: string;
  formName: string;
  formVersion: number;
  policyId: string;
  policyName: string;
  policySlug: string;
  subjectName?: string;
  subjectEmail: string;
  subjectReference?: string;
  status: ConsentRecord["status"];
  description: string;
  choices: Record<string, boolean>;
  purposes: ConsentPurpose[];
  evidence: Record<string, unknown>;
  snapshot: Record<string, unknown>;
  grantedAt?: string;
  withdrawnAt?: string;
  createdAt: string;
}

export const consentsApi = {
  listForms: () => apiRequest<ConsentForm[]>(API_ENDPOINTS.consents.forms),
  listActivityLogs: () =>
    apiRequest<ConsentActivityLog[]>(API_ENDPOINTS.consents.activityLogs),
  createForm: (data: {
    policyId: string;
    templateId?: string;
    name: string;
    description?: string;
    purposes: ConsentPurpose[];
    fields?: ConsentField[];
  }) =>
    apiRequest<ConsentForm>(API_ENDPOINTS.consents.forms, {
      method: "POST",
      body: data,
    }),
  updateForm: (
    id: string,
    data: Partial<{
      policyId: string;
      templateId: string;
      name: string;
      description: string;
      purposes: ConsentPurpose[];
      fields: ConsentField[];
      status: "active" | "inactive";
    }>,
  ) =>
    apiRequest<ConsentForm>(API_ENDPOINTS.consents.form(id), {
      method: "PUT",
      body: data,
    }),
  publicForPolicy: (slug: string) =>
    apiRequest<PublicConsentForm>(
      API_ENDPOINTS.consents.publicForPolicy(slug),
      { authenticated: false },
    ),
  submitPublic: (
    token: string,
    data: {
      subjectName?: string;
      subjectEmail: string;
      subjectReference?: string;
      choices: Record<string, boolean>;
      fieldValues?: Record<string, string | boolean>;
    },
  ) =>
    apiRequest<ConsentRecord>(API_ENDPOINTS.consents.publicResponses(token), {
      method: "POST",
      body: data,
      authenticated: false,
    }),
  listRecords: (
    params: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.set(key, String(value));
    });
    return apiRequest<{
      records: ConsentRecord[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`${API_ENDPOINTS.consents.records}?${query}`);
  },
  listEvents: (id: string) =>
    apiRequest<
      Array<{
        id: string;
        type: string;
        description: string;
        snapshot: Record<string, unknown>;
        createdAt: string;
      }>
    >(API_ENDPOINTS.consents.events(id)),
  withdraw: (id: string, reason?: string) =>
    apiRequest<ConsentRecord>(API_ENDPOINTS.consents.withdraw(id), {
      method: "POST",
      body: { reason },
    }),
};
