export type PolicyStatus = 'Draft' | 'pending_review' | 'approved' | 'rejected' | 'edited'

export interface SavedPolicy {
  id: string
  slug: string
  type: string
  typeName: string
  typeIcon: string
  websiteName: string
  domain: string
  language: string
  status: PolicyStatus
  createdAt: string
  updatedAt: string
  htmlContent: string
  ownerEmail: string
  ownerName?: string
  reviewComment?: string
  reviewedAt?: string
  approvalDeadline?: string
  downloads?: { pdf?: string | null; docx?: string | null; txt?: string | null; html?: string | null }
  shareUrl?: string | null
}
