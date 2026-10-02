import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export type CompanyDocumentValidationStatus =
  | "UPLOADING" | "UPLOADED" | "QUEUED" | "PROCESSING" | "RETRYING"
  | "PASSED" | "FAILED" | "NEEDS_REVIEW" | "ERROR";
export type CompanyDocumentArchiveStatus =
  | "NOT_STARTED" | "QUEUED" | "UPLOADING" | "ARCHIVED" | "RETRYING" | "FAILED";

export interface CompanyDocument {
  id: string;
  policyDraftId: string;
  policyId: string | null;
  companyNameEntered: string;
  companyNameExtracted: string | null;
  companyRegistrationNumber: string | null;
  originalFileName: string;
  storedFileName: string;
  validationStatus: CompanyDocumentValidationStatus;
  confidenceScore: number | null;
  failureReason: string | null;
  archiveStatus: CompanyDocumentArchiveStatus;
  createdAt: string | null;
  processedAt: string | null;
  archivedAt: string | null;
}

export interface AdminCompanyDocument extends CompanyDocument {
  merchantId: string;
  uploadedBy: string;
  normalizedEnteredName: string;
  normalizedExtractedName: string | null;
  contentType: string;
  fileSize: number;
  fileSha256: string | null;
  ocrProvider: string | null;
  ocrVersion: string | null;
  ocrAttempts: number;
  ocrText: string | null;
  matchMethod: string | null;
  matchReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  driveFileId: string | null;
  driveFolderId: string | null;
  driveWebViewLink: string | null;
  archiveAttempts: number;
  archiveError: string | null;
  merchant: { id: string; name: string; email: string };
}

interface UploadUrlResponse {
  documentId: string;
  policyDraftId: string;
  storedFileName: string;
  uploadUrl: string;
  expiresIn: number;
  validationStatus: CompanyDocumentValidationStatus;
}

export const companyDocumentsApi = {
  createUploadUrl: (input: {
    policyDraftId?: string;
    companyName: string;
    companyRegistrationNumber?: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
  }) => apiRequest<UploadUrlResponse>(API_ENDPOINTS.companyDocuments.uploadUrl, {
    method: "POST",
    body: input,
    timeout: 60_000,
  }),
  upload: async (uploadUrl: string, file: File) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 120_000);
    try {
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Upload failed (${response.status})`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("การอัปโหลดไฟล์ใช้เวลานานเกิน 2 นาที กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  },
  complete: (documentId: string, sha256: string) =>
    apiRequest<{ documentId: string; validationStatus: CompanyDocumentValidationStatus }>(
      API_ENDPOINTS.companyDocuments.complete(documentId), {
        method: "POST",
        body: { sha256 },
        timeout: 120_000,
      },
    ),
  get: (documentId: string) => apiRequest<CompanyDocument>(API_ENDPOINTS.companyDocuments.detail(documentId)),
  retry: (documentId: string) => apiRequest<{ documentId: string; validationStatus: CompanyDocumentValidationStatus }>(
    API_ENDPOINTS.companyDocuments.retry(documentId), { method: "POST" },
  ),
};

export const fileSha256 = async (file: File) => {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
};
