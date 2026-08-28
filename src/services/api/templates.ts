import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { ConsentField } from "./consents";

export type DocumentTemplateStatus = "active" | "inactive";
export interface DocumentTemplate {
  id: string;
  title: string;
  category: string;
  purpose: string;
  content: string;
  disclaimer: string;
  fields: ConsentField[];
  status: DocumentTemplateStatus;
  createdAt: string;
  updatedAt: string;
}
export type DocumentTemplateInput = Pick<
  DocumentTemplate,
  "title" | "category" | "purpose" | "content" | "disclaimer" | "fields" | "status"
>;

export const templatesApi = {
  list: () => apiRequest<DocumentTemplate[]>(API_ENDPOINTS.templates.root),
  adminList: () =>
    apiRequest<DocumentTemplate[]>(API_ENDPOINTS.admin.templates),
  create: (data: DocumentTemplateInput) =>
    apiRequest<DocumentTemplate>(API_ENDPOINTS.admin.templates, {
      method: "POST",
      body: data,
    }),
  update: (id: string, data: Partial<DocumentTemplateInput>) =>
    apiRequest<DocumentTemplate>(API_ENDPOINTS.admin.template(id), {
      method: "PUT",
      body: data,
    }),
  delete: (id: string) =>
    apiRequest<{ id: string; deleted: boolean }>(
      API_ENDPOINTS.admin.template(id),
      { method: "DELETE" },
    ),
};
