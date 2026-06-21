export type PolicyType = 'privacy' | 'hr' | 'cctv' | 'recruitment' | 'vendor' | 'dpa'
export type PolicyLanguage = 'th' | 'en' | 'both'
export type PolicyStatus = 'pending_review' | 'approved' | 'rejected' | 'edited' | 'archived'
export type PolicyReviewStatus = 'approved' | 'rejected' | 'edited'
export type ChangeRequestStatus = 'pending_review' | 'resolved' | 'rejected'
export type ChangeRequestPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface PolicyQuestionnaire {
  policyType: PolicyType
  agreedToTerms: true
  ownerType: 'person' | 'company'
  ownerFullName?: string
  ownerIdCard?: string
  companyName?: string
  companyRegNumber?: string
  websiteName: string
  websiteUrl: string
  businessType: string
  contactEmail: string
  contactPhone?: string
  address?: string
  dataTypes: string[]
  hasCookies?: boolean | string
  hasUserAccounts?: boolean | string
  purposes: string[]
  thirdParties: string[]
  language: PolicyLanguage
  exportFormat: string[]
  dpoEmail?: string
  retentionPeriod: string
  templateVersion?: string
  useAI?: boolean
}

export interface PolicyDownloads {
  pdf: string | null
  docx: string | null
  txt: string | null
  html: string | null
}

export interface SavedPolicy {
  id: string
  slug: string
  type: PolicyType | string
  typeName: string
  typeIcon: string
  websiteName: string
  domain: string
  language: PolicyLanguage
  status: PolicyStatus
  createdAt: string
  updatedAt: string
  htmlContent: string
  htmlContentByLanguage: { th: string | null; en: string | null }
  contentByLanguage?: { th: string | null; en: string | null }
  ownerEmail: string
  ownerName?: string | null
  reviewComment?: string | null
  reviewedAt?: string | null
  reviewedBy?: string | null
  lastEditedBy?: string | null
  lastEditedAt?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  assignedLegalUserId?: string | null
  assignedAt?: string | null
  assignmentNote?: string | null
  approvalDeadline?: string | null
  googleDocId?: string | null
  googleDocUrl?: string | null
  shareUrl?: string | null
  shareUrls: { th: string | null; en: string | null }
  htmlEmbed?: string | null
  htmlEmbeds: { th: string | null; en: string | null }
  downloads: PolicyDownloads
  downloadsByLanguage: { th: PolicyDownloads; en: PolicyDownloads }
  formData?: Record<string, unknown>
  version?: number
}

export interface PolicyChangeRequestCreate {
  requesterName?: string
  requesterEmail: string
  language: PolicyLanguage
  sectionTitle?: string
  selectedText?: string
  lineStart?: number
  lineEnd?: number
  requestedChange: string
  reason?: string
  priority: ChangeRequestPriority
  merchantComment?: string
}

export interface PolicyChangeRequest {
  id: string
  policyId: string
  policySlug: string
  merchantId?: string
  websiteName?: string | null
  requesterName?: string | null
  requesterEmail: string
  language: PolicyLanguage
  sectionTitle?: string | null
  selectedText?: string | null
  lineStart?: number | null
  lineEnd?: number | null
  requestedChange: string
  reason?: string | null
  priority: ChangeRequestPriority
  status: ChangeRequestStatus
  merchantComment?: string | null
  merchantReviewedAt?: string | null
  legalComment?: string | null
  policyVersion?: number | null
  resolvedAt?: string | null
  createdAt: string
  updatedAt?: string | null
  policy?: SavedPolicy
}

export interface LegalSubmissionPatch {
  approvalDeadline?: string | null
  content?:
    | { language: 'th' | 'en'; text: string }
    | { language: 'both'; contentTh: string; contentEn: string }
  review?: { status: PolicyReviewStatus; reviewComment?: string | null }
}

export interface LegalChangeRequestReview {
  status: 'resolved' | 'rejected'
  legalComment: string
  policyVersion?: number
}

export interface LegalDashboard {
  reviewer: { id: string | null; name: string; email: string }
  summary: {
    pendingPolicies: number
    overduePolicies: number
    dueWithin24Hours: number
    pendingChangeRequests: number
    approvedThisMonth: number
    editedThisMonth: number
  }
  pendingPolicies: Array<{
    policyId: string
    slug: string
    type: string
    websiteName: string
    language: PolicyLanguage
    approvalDeadline: string | null
    isOverdue: boolean
    assignmentNote: string | null
    createdAt: string
  }>
  pendingChangeRequests: Array<{
    requestId: string
    policyId: string
    policySlug: string
    websiteName: string
    priority: ChangeRequestPriority
    requestedChange: string
    createdAt: string
  }>
  recentReviews: Array<{
    reviewId: string
    policyId: string
    policySlug: string
    websiteName: string
    status: PolicyReviewStatus
    reviewedAt: string
  }>
}

export interface ArchivePolicyResult {
  policyId: string
  status: 'archived'
}
