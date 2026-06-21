# FlowPDPA — Backend API Specification & Database Schema

**Version:** 1.1  
**Date:** 2026-06-20  
**For:** Backend Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Policy Creation & AI Generation Flow](#policy-creation--ai-generation-flow)
4. [API Specification](#api-specification)
5. [Database Schema](#database-schema)
6. [AI Integration Requirements](#ai-integration-requirements)
7. [Response/Request Formats](#responserequest-formats)

---

## Overview

### Base URL
```
https://api.flowpdpa.co.th
```

The FastAPI application routes do not include a `/v1` prefix. Add one only if the production reverse proxy is configured to rewrite it.

### Authentication
- **Method:** JWT Bearer Token
- **Header:** `Authorization: Bearer <token>`
- **Access Token Expiry:** 15 minutes (configurable)
- **Refresh Token Expiry:** 7 days (configurable)

### Response Format
Errors always use this envelope:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

Successful response shapes are endpoint-specific. Some return `{ "success": true, "data": ... }`; policy/legal/billing list endpoints may return an array directly. Frontend must follow each endpoint example rather than assuming one global success envelope.

---

## Authentication Flow

> The endpoint specifications in section 1 are authoritative. Registration requires OTP verification before tokens are issued; users and admins authenticate from database accounts.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. REGISTER (New User)                                                │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ POST /auth/register                                             │ │
│     │ Request: { name, email, password }                              │ │
│     │ Response: { email, expiresIn, canResendIn }                     │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ • Store pending registration and send OTP                       │ │
│     │ • POST /auth/register/verify with email + OTP                   │ │
│     │ • Create account and return access + refresh tokens             │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  2. LOGIN (Existing User)                                              │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ POST /auth/login                                                │ │
│     │ Request: { email, password }                                    │ │
│     │ Response: { user, token, plan } OR error                        │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ Regular User:                                                    │ │
│     │ • Verify password hash                                          │ │
│     │ • Generate JWT token with: { sub, merchant_id, role, plan }    │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  3. ADMIN LOGIN                                                        │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ POST /auth/login (merchant, legal, admin)                      │ │
│     │ Request: { email: "admin@flowpdpa.co.th", password }           │ │
│     │ Response: { token, role: "admin" }                              │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ • Verify database account and role="admin"                     │ │
│     │ • Generate JWT with role="admin"                                │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Policy Creation & AI Generation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    POLICY CREATION & AI FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FRONTEND: /create/policy (6-Step Wizard)                              │
│     │                                                                  │
│     ├── Step 1: Select Policy Type (privacy, hr, cctv, etc.)          │
│     ├── Step 2: Business Info (website name, URL, type, email)        │
│     ├── Step 3: Data Types Collected (10 standard + 3 sensitive)       │
│     ├── Step 4: Purposes + Third Parties                               │
│     ├── Step 5: Settings (language, export format, DPO, retention)     │
│     └── Step 6: Review Summary                                         │
│                                                                         │
│                              │                                          │
│                              ▼ (User clicks "สร้างนโยบาย")           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ AUTH GATE CHECK                                                 │   │
│  │ • Is user logged in? (Check JWT token)                          │   │
│  │ • No → Return 401 → Frontend shows AuthGate modal               │   │
│  │ • Yes → Proceed to generation                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ API: POST /policies                                    │   │
│  │ Request: { formData: {...}, authToken }                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ BACKEND PROCESSING                                              │   │
│  │                                                                 │   │
│  │ 1. VALIDATE INPUT                                               │   │
│  │    • Check required fields                                      │   │
│  │    • Validate business type, data types, purposes               │   │
│  │    • Check policyType billing entitlement                       │   │
│  │                                                                 │   │
│  │ 2. PREPARE AI PROMPT                                            │   │
│  │    • Build structured prompt from form data                     │   │
│  │    • Include legal requirements (PDPA Thailand)                 │   │
│  │    • Add compliance clauses defined by the selected product     │   │
│  │                                                                 │   │
│  │ 3. CALL AI SERVICE (Async)                                      │   │
│  │    • Send prompt to AI engine                                   │   │
│  │    • AI generates legal-compliant policy text                  │   │
│  │    • Generate in requested language(s)                          │   │
│  │                                                                 │   │
│  │ 4. STORE POLICY RECORD                                          │   │
│  │    • Save policy metadata to DB                                 │   │
│  │    • Store generated content (with versioning)                  │   │
│  │    • Link to merchant_id                                        │   │
│  │                                                                 │   │
│  │ 5. WAIT FOR LEGAL REVIEW                                        │   │
│  │    • Legal edits DB content in portal                                             │   │
│  │    • Legal approves, rejects, or marks edited                                    │   │
│  │    • Exports are generated only after approval                                   │   │
│  │    • Public links remain hidden before approval                                       │   │
│  │                                                                 │   │
│  │ 6. RETURN PENDING REVIEW RESPONSE                                              │   │
│  │    • Policy ID, slug, status pending_review                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ FRONTEND: Success Screen                                        │   │
│  │ • Show pending legal review message                                 │   │
│  │ • No public URL until approved/edited               │   │
│  │ • Downloads appear after legal approval                             │   │
│  │ • Copy URL button                                               │   │
│  │ • "View Dashboard" button                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Specification

### 1. Authentication APIs

#### 1.1 Register New User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "string (required, min 2 chars)",
  "email": "string (required, email format)",
  "phone": "string (optional, Thai format: 08x-xxx-xxxx)",
  "company": "string (optional, company/organization name)",
  "password": "string (required, min 8 chars)"
}

Response 201:
{
  "success": true,
  "message": "OTP sent",
  "data": {
    "email": "john@example.com",
    "expiresIn": 300,
    "canResendIn": 60
  }
}
```

`POST /auth/register` starts OTP registration. It does not return authentication tokens yet.

#### 1.2 Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}

Response 200:
{
  "success": true,
  "data": {
    "user": {
      "id": "merchant_uuid",
      "name": "Demo User",
      "email": "demo@flowpdpa.co.th",
      "plan": "Premium",
      "company": "Demo Company",
      "phone": "02-xxx-xxxx",
      "role": "merchant"
    },
    "token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token",
    "token_type": "bearer",
    "expires_in": 900
  }
}

Response 401:
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
  }
}
```

#### 1.3 Role-Based Login Routing

`POST /auth/login` is the only login endpoint. It authenticates `merchant`, `legal`, and `admin` accounts and returns `data.user.role`.

- `merchant` -> `/dashboard`
- `legal` -> `/legal`
- `admin` -> `/admin`

#### 1.4 Verify Token (for protected routes)
```http
GET /auth/verify
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "merchant_uuid",
      "email": "user@example.com",
      "plan": "Free"
    }
  }
}
```

#### 1.5 Verify Registration OTP
```http
POST /auth/register/verify
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

On success, creates the merchant account and returns `user`, `token`, `refresh_token`, `token_type = bearer`, and `expires_in = 900`.

Compatibility route: `POST /otp/register/verify`.

#### 1.6 Resend Registration OTP
```http
POST /auth/register/resend-otp
Content-Type: application/json

{
  "email": "john@example.com"
}
```

Compatibility route: `POST /otp/register/resend-otp`. Frontend must respect `canResendIn`, `RESEND_COOLDOWN`, and resend-attempt limits.

#### 1.7 Refresh Tokens
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "jwt_refresh_token"
}
```

Response 200 returns `access_token`, rotated `refresh_token`, `token_type`, and `expires_in`. This response is not wrapped in `success/data`.

#### 1.8 Request Password Reset
```http
POST /auth/password-reset/request
Content-Type: application/json

{
  "email": "john@example.com"
}
```

Always returns the same `200` response so callers cannot discover registered emails. A real account receives a six-digit code that expires after 10 minutes. Resend has a 60-second cooldown and a maximum of five sends per reset window.

```json
{
  "success": true,
  "data": {
    "expiresIn": 600,
    "canResendIn": 60
  }
}
```

#### 1.9 Confirm Password Reset
```http
POST /auth/password-reset/confirm
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

The code is single-use and allows at most five failed attempts. Success updates the password hash and removes the reset state from Redis.

```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

---

### 2. Policy + Legal Review APIs

Current flow:

```text
Merchant submits form
-> AI generates content_th and optional content_en
-> Backend saves DB row with status = pending_review
-> Legal edits content directly in the Legal Portal
-> Legal approves/rejects/marks edited
-> Backend exports PDF/DOCX/TXT/HTML only after approved or edited
-> Public links are visible only after approved or edited
```

Policy statuses:

```ts
type PolicyStatus = 'pending_review' | 'approved' | 'rejected' | 'edited' | 'archived'
```

Shared response shape (`SavedPolicy`):

```ts
interface SavedPolicy {
  id: string
  slug: string
  type: string
  typeName: string
  typeIcon: string
  websiteName: string
  domain: string
  language: 'th' | 'en' | 'both'
  status: PolicyStatus
  createdAt: string
  updatedAt: string
  htmlContent: string
  htmlContentByLanguage: { th: string | null; en: string | null }
  contentByLanguage?: { th: string | null; en: string | null } // raw Markdown, included in authenticated detail responses for Legal editing
  ownerEmail: string
  ownerName?: string
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
  downloads: { pdf: string | null; docx: string | null; txt: string | null; html: string | null }
  downloadsByLanguage: {
    th: { pdf: string | null; docx: string | null; txt: string | null; html: string | null }
    en: { pdf: string | null; docx: string | null; txt: string | null; html: string | null }
  }
  formData?: object
}
```

#### 2.1 Create Policy Submission (AI Draft)
Billing rule before creating:

- Stripe billing is enabled: `STRIPE_BILLING_ENABLED=true`.
- `privacy` is free and uses the complete flow without payment.
- `hr`, `cctv`, `recruitment`, `vendor`, and `dpa` require an active monthly subscription for that policy type.
- Both free and paid flows include AI draft, DB storage, legal review/edit/approval, final exports, public policy page, and change requests.
- `retentionPeriod` is legal content only. It describes how long the merchant keeps personal data.
- `retentionPeriod` never controls Stripe price, subscription length, or cancellation date.
- Backend maps every paid `policyType` to a server-side Stripe monthly Price.
- A paid request without an active entitlement returns `402 SUBSCRIPTION_REQUIRED` and points to `POST /billing/checkout-sessions`.
- Frontend must never decide whether a type is free or trust a client-supplied amount/Stripe Price ID.

Legal assignment after creating:

- Backend automatically assigns the pending policy to the active legal user with the fewest pending policies.
- Frontend and merchant do not choose a legal reviewer.
- If no active legal user exists, the policy remains unassigned with `assignmentNote = Awaiting an active legal reviewer`.
- Creating or reactivating a legal user automatically distributes the unassigned backlog.

```http
POST /policies
Authorization: Bearer <merchant_token>
Content-Type: application/json

{
  "policyType": "privacy",
  "agreedToTerms": true,
  "ownerType": "company",
  "ownerFullName": "",
  "ownerIdCard": "",
  "companyName": "Example Co., Ltd.",
  "companyRegNumber": "0105565012345",
  "websiteName": "My Website",
  "websiteUrl": "https://example.com",
  "businessType": "SME / วิสาหกิจขนาดกลางและเล็ก",
  "contactEmail": "contact@example.com",
  "contactPhone": "0812345678",
  "address": "123 Bangkok",
  "dataTypes": ["name", "email", "phone", "ip"],
  "purposes": ["service", "contact", "analytics"],
  "thirdParties": ["ga", "fb"],
  "language": "th",
  "exportFormat": ["PDF", "Word (.docx)", "TXT", "HTML Embed"],
  "dpoEmail": "dpo@example.com",
  "retentionPeriod": "2 ปี",
  "templateVersion": "v1-dev",
  "useAI": true
}
```

Response 201:

```json
{
  "id": "policy_uuid",
  "slug": "example-com-privacy-a1b2c3d4",
  "type": "privacy",
  "typeName": "Privacy + Cookies Policy",
  "typeIcon": "lock",
  "websiteName": "My Website",
  "domain": "example.com",
  "language": "th",
  "status": "pending_review",
  "createdAt": "2026-06-19T10:00:00Z",
  "updatedAt": "2026-06-19T10:00:00Z",
  "htmlContent": "<!doctype html>...",
  "htmlContentByLanguage": {
    "th": "<!doctype html>...",
    "en": null
  },
  "ownerEmail": "contact@example.com",
  "ownerName": "Example Co., Ltd.",
  "approvalDeadline": "2026-06-21T10:00:00Z",
  "shareUrl": null,
  "shareUrls": { "th": null, "en": null },
  "downloads": { "pdf": null, "docx": null, "txt": null, "html": null },
  "downloadsByLanguage": {
    "th": { "pdf": null, "docx": null, "txt": null, "html": null },
    "en": { "pdf": null, "docx": null, "txt": null, "html": null }
  }
}
```

Notes:
- No final downloads are generated at submission time.
- `language: "both"` stores separate `content_th` and `content_en`.
- In the current free release this endpoint never returns a billing-related `402`.
- After billing is enabled, a paid `policyType` without entitlement returns `402 PAYMENT_REQUIRED`.

#### 2.2 Customer List Policies
```http
GET /policies
Authorization: Bearer <merchant_token>
```

Returns only active merchant policies. Policies with `status = archived` are excluded from this normal list.

Response 200:

```json
[
  {
    "id": "policy_uuid",
    "slug": "example-com-privacy-a1b2c3d4",
    "type": "privacy",
    "typeName": "Privacy + Cookies Policy",
    "websiteName": "My Website",
    "domain": "example.com",
    "language": "both",
    "status": "pending_review",
    "reviewComment": null,
    "reviewedAt": null,
    "approvalDeadline": "2026-06-21T10:00:00Z",
    "googleDocId": null,
    "googleDocUrl": null,
    "shareUrl": null,
    "downloads": { "pdf": null, "docx": null, "txt": null, "html": null }
  }
]
```

#### 2.3 Customer Get Policy Detail
```http
GET /policies/:policyId
Authorization: Bearer <merchant_token>
```

Response 200:

```json
{
  "success": true,
  "data": {
    "id": "policy_uuid",
    "slug": "example-com-privacy-a1b2c3d4",
    "status": "pending_review",
    "htmlContentByLanguage": {
      "th": "<!doctype html>...",
      "en": "<!doctype html>..."
    },
    "formData": { "...": "original merchant request" },
    "reviewComment": null,
    "shareUrls": { "th": null, "en": null },
    "downloadsByLanguage": {
      "th": { "pdf": null, "docx": null, "txt": null, "html": null },
      "en": { "pdf": null, "docx": null, "txt": null, "html": null }
    }
  }
}
```

#### 2.3.1 Merchant Regenerate Policy
Replaces the complete merchant questionnaire for an existing policy and generates a new AI draft. It preserves the policy ID and public slug, increments the version, clears old final exports, and sets `status = pending_review` for legal review again.

```http
PUT /policies/:policyId
Authorization: Bearer <merchant_token>
Content-Type: application/json
```

The body is the same complete questionnaire used by `POST /policies`:

```json
{
  "policyType": "privacy",
  "agreedToTerms": true,
  "ownerType": "company",
  "companyName": "Example Co., Ltd.",
  "companyRegNumber": "0105559999999",
  "websiteName": "My Website",
  "websiteUrl": "https://example.com",
  "businessType": "SME",
  "contactEmail": "contact@example.com",
  "contactPhone": "0812345678",
  "address": "123 Bangkok",
  "dataTypes": ["name", "email", "phone", "ip"],
  "hasCookies": true,
  "hasUserAccounts": false,
  "purposes": ["service", "contact", "analytics"],
  "thirdParties": ["ga", "fb"],
  "language": "th",
  "dpoEmail": "dpo@example.com",
  "retentionPeriod": "2 years",
  "exportFormat": ["PDF", "Word (.docx)", "TXT", "HTML Embed"],
  "templateVersion": "v1-dev",
  "useAI": true
}
```

Use `PUT` only when the merchant changes the submitted questionnaire and wants AI to regenerate the entire policy. Legal text edits use `PATCH /legal/submissions/:slug` instead.

Response 200:

```json
{
  "success": true,
  "data": {
    "policyId": "policy_uuid",
    "slug": "example-com-privacy-a1b2c3d4",
    "status": "pending_review",
    "version": 2,
    "content": { "th": "...", "en": null },
    "formData": { "...": "complete updated questionnaire" }
  }
}
```

#### 2.4 Legal Login

Legal users sign in through the shared `POST /auth/login` endpoint from Section 1.2. The frontend reads `data.user.role = "legal"` and routes the user to `/legal`.

Admin creates legal accounts through `POST /admin/legal-users`.

#### 2.5 Merchant Creates Policy Change Request
Used after a customer/data subject contacts the merchant and the merchant verifies that the policy should be reviewed. This request goes directly to FlowPDPA legal with `status = pending_review`.

```http
POST /policies/:policyId/change-requests
Authorization: Bearer <merchant_token>
Content-Type: application/json

{
  "requesterName": "John Customer",
  "requesterEmail": "customer@example.com",
  "language": "th",
  "sectionTitle": "3. วัตถุประสงค์ในการประมวลผลข้อมูล",
  "selectedText": "เราใช้ข้อมูลเพื่อวิเคราะห์การใช้งานเว็บไซต์",
  "lineStart": 42,
  "lineEnd": 48,
  "requestedChange": "Customer asked us to remove analytics purpose.",
  "reason": "Merchant confirmed we no longer use Google Analytics.",
  "priority": "normal",
  "merchantComment": "Verified by merchant. Please update the policy."
}
```

Response 201:

```json
{
  "id": "change_request_uuid",
  "policyId": "policy_uuid",
  "policySlug": "example-com-privacy-a1b2c3d4",
  "requesterEmail": "customer@example.com",
  "language": "th",
  "sectionTitle": "3. วัตถุประสงค์ในการประมวลผลข้อมูล",
  "selectedText": "เราใช้ข้อมูลเพื่อวิเคราะห์การใช้งานเว็บไซต์",
  "requestedChange": "Customer asked us to remove analytics purpose.",
  "status": "pending_review",
  "merchantComment": "Verified by merchant. Please update the policy.",
  "merchantReviewedAt": "2026-06-19T10:00:00Z",
  "createdAt": "2026-06-19T10:00:00Z"
}
```

How frontend knows "which part":
- Merchant portal should render sections with anchors like `section-3-purposes`.
- Merchant can select/copy the section the customer complained about.
- If customer highlights text, send `selectedText`.
- If viewer/editor supports it, send `lineStart` and `lineEnd`.

#### 2.6 Merchant List Change Requests

```http
GET /policies/:policyId/change-requests
GET /policies/:policyId/change-requests?status=pending_review
GET /policies/:policyId/change-requests?status=resolved
Authorization: Bearer <merchant_token>
```

Response 200:

```json
[
  {
    "id": "change_request_uuid",
    "requesterName": "John Customer",
    "requesterEmail": "customer@example.com",
    "language": "th",
    "sectionTitle": "3. วัตถุประสงค์ในการประมวลผลข้อมูล",
    "selectedText": "เราใช้ข้อมูลเพื่อวิเคราะห์การใช้งานเว็บไซต์",
    "requestedChange": "Customer asked us to remove analytics purpose.",
    "status": "pending_review",
    "merchantComment": "Verified by merchant. Please update the policy.",
    "legalComment": null,
    "createdAt": "2026-06-19T10:00:00Z"
  }
]
```

#### 2.6.1 Merchant Change Request Detail

```http
GET /policies/:policyId/change-requests/:requestId
Authorization: Bearer <merchant_token>
```

No body.

Response 200: one change request object. Merchant can only see requests for policies they own.

```json
{
  "id": "change_request_uuid",
  "policyId": "policy_uuid",
  "policySlug": "example-com-privacy-a1b2c3d4",
  "requesterName": "John Customer",
  "requesterEmail": "customer@example.com",
  "language": "th",
  "sectionTitle": "3. Purposes",
  "selectedText": "analytics tracking text",
  "lineStart": 42,
  "lineEnd": 48,
  "requestedChange": "Customer asked us to remove analytics purpose.",
  "reason": "Merchant confirmed we no longer use Google Analytics.",
  "priority": "normal",
  "status": "pending_review",
  "merchantComment": "Verified by merchant. Please update the policy.",
  "legalComment": null,
  "policyVersion": null,
  "createdAt": "2026-06-19T10:00:00Z"
}
```

Status meaning:
- `pending_review`: request is in FlowPDPA legal queue.
- `resolved`: legal updated the policy.
- `rejected`: legal rejected the change request.

#### 2.6.2 Legal Dashboard
```http
GET /legal/dashboard
Authorization: Bearer <legal_token>
```

Returns only the authenticated legal reviewer's assigned workload. Each queue is limited to 10 items; use the full queue endpoints for pagination and filtering.

Response 200:

```json
{
  "success": true,
  "data": {
    "reviewer": {
      "id": "legal_uuid",
      "name": "Legal Reviewer",
      "email": "legal@flowpdpa.co.th"
    },
    "summary": {
      "pendingPolicies": 12,
      "overduePolicies": 2,
      "dueWithin24Hours": 3,
      "pendingChangeRequests": 4,
      "approvedThisMonth": 30,
      "editedThisMonth": 8
    },
    "pendingPolicies": [
      {
        "policyId": "policy_uuid",
        "slug": "example-com-privacy-a1b2c3d4",
        "type": "privacy",
        "websiteName": "Example Website",
        "language": "both",
        "approvalDeadline": "2026-06-21T10:00:00Z",
        "isOverdue": false,
        "assignmentNote": "Urgent client",
        "createdAt": "2026-06-20T10:00:00Z"
      }
    ],
    "pendingChangeRequests": [],
    "recentReviews": []
  }
}
```

Dashboard rules:

- `overduePolicies` means deadline is earlier than the current time.
- `dueWithin24Hours` excludes already overdue policies.
- Monthly totals use immutable `legal_review_events` in the current UTC calendar month.
- Admin and merchant tokens cannot access this endpoint.

#### 2.7 Legal Queue
Database legal users receive only policies assigned to their account by automatic workload balancing or an Admin override.

```http
GET /legal/submissions
GET /legal/submissions?status=pending_review
GET /legal/submissions?status=approved
GET /legal/submissions?status=rejected
GET /legal/submissions?status=edited
Authorization: Bearer <legal_token>
```

Response 200:

```json
[
  {
    "id": "policy_uuid",
    "slug": "example-com-privacy-a1b2c3d4",
    "websiteName": "My Website",
    "domain": "example.com",
    "language": "both",
    "status": "pending_review",
    "htmlContent": "<!doctype html>...",
    "htmlContentByLanguage": {
      "th": "<!doctype html>...",
      "en": "<!doctype html>..."
    },
    "ownerEmail": "contact@example.com",
    "ownerName": "Example Co., Ltd.",
    "approvalDeadline": "2026-06-21T10:00:00Z"
  }
]
```

#### 2.8 Legal Detail
```http
GET /legal/submissions/:slug
Authorization: Bearer <legal_token>
```

Response is one full `SavedPolicy` object and includes `formData`, `htmlContentByLanguage`, review fields, and downloads.

#### 2.9 Legal Change Request Queue
```http
GET /legal/change-requests
GET /legal/change-requests?status=pending_review
GET /legal/change-requests?policySlug=example-com-privacy-a1b2c3d4
Authorization: Bearer <legal_token>
```

Response 200:

```json
[
  {
    "id": "change_request_uuid",
    "policyId": "policy_uuid",
    "policySlug": "example-com-privacy-a1b2c3d4",
    "merchantId": "merchant_uuid",
    "websiteName": "My Website",
    "language": "th",
    "sectionTitle": "3. วัตถุประสงค์ในการประมวลผลข้อมูล",
    "selectedText": "เราใช้ข้อมูลเพื่อวิเคราะห์การใช้งานเว็บไซต์",
    "lineStart": 42,
    "lineEnd": 48,
    "requestedChange": "Please remove analytics purpose.",
    "reason": "Business stopped using Google Analytics",
    "priority": "normal",
    "status": "pending_review",
    "createdAt": "2026-06-19T10:00:00Z"
  }
]
```

#### 2.9.1 Legal Change Request Detail

```http
GET /legal/change-requests/:requestId
Authorization: Bearer <legal_token>
```

No body.

Response 200: one change request object plus related policy context.

```json
{
  "id": "change_request_uuid",
  "policyId": "policy_uuid",
  "policySlug": "example-com-privacy-a1b2c3d4",
  "websiteName": "My Website",
  "language": "th",
  "sectionTitle": "3. Purposes",
  "selectedText": "analytics tracking text",
  "requestedChange": "Please remove analytics purpose.",
  "reason": "Business stopped using Google Analytics",
  "priority": "normal",
  "status": "pending_review",
  "merchantComment": "Verified by merchant. Please update the policy.",
  "legalComment": null,
  "policy": {
    "id": "policy_uuid",
    "slug": "example-com-privacy-a1b2c3d4",
    "status": "approved",
    "version": 2,
    "htmlContentByLanguage": {
      "th": "<!doctype html>...",
      "en": null
    },
    "formData": {}
  }
}
```

#### 2.10 Legal Resolve Change Request
Legal should first edit policy content with `PATCH /legal/submissions/:slug`, then resolve the request. When status is `resolved`, backend saves the current DB policy content as a new `policy_versions` row, increments `policies.version`, regenerates final exports, and keeps the public page on the same slug.

```http
PATCH /legal/change-requests/:requestId
Authorization: Bearer <legal_token>
Content-Type: application/json

{
  "status": "resolved",
  "legalComment": "Removed analytics purpose from Thai policy section 3."
}
```

Reject request:

```json
{
  "status": "rejected",
  "legalComment": "Analytics purpose must remain because merchant still uses tracking in submitted form data."
}
```

Rules:

- `resolved`: `legalComment` must contain text. Backend creates the next policy version automatically.
- `rejected`: `legalComment` must contain text.

Response 200:

```json
{
  "id": "change_request_uuid",
  "status": "resolved",
  "policyId": "policy_uuid",
  "policySlug": "example-com-privacy-a1b2c3d4",
  "policyVersion": 3,
  "legalComment": "Removed analytics purpose from Thai policy section 3.",
  "resolvedAt": "2026-06-19T12:00:00Z"
}
```

Merchant gets the new version through existing endpoints:

```http
GET /policies/:policyId
GET /policies
GET /policies/:policyId/change-requests
```

`GET /policies/:policyId` returns the updated `version`, `htmlContentByLanguage`, `downloadsByLanguage`, and same public `shareUrls`.

#### 2.11 Legal Update Submission
Main endpoint for legal portal edits. Use this one endpoint to update deadline, save edited content, approve, reject, or mark as edited.

```http
PATCH /legal/submissions/:slug
Authorization: Bearer <legal_token>
Content-Type: application/json
```

Update or clear deadline:

```json
{
  "approvalDeadline": "2026-06-21T10:00:00Z"
}
```

```json
{
  "approvalDeadline": null
}
```

Save Thai content:

```json
{
  "content": {
    "language": "th",
    "text": "# Privacy Policy Thai markdown\n\n..."
  }
}
```

Save English content:

```json
{
  "content": {
    "language": "en",
    "text": "# Privacy Policy\n\n..."
  }
}
```

Save both languages:

```json
{
  "content": {
    "language": "both",
    "contentTh": "# Privacy Policy Thai markdown\n\n...",
    "contentEn": "# Privacy Policy\n\n..."
  }
}
```

Approve and export final files from DB content. `reviewComment` can be omitted or `null`:

```json
{
  "review": {
    "status": "approved",
    "reviewComment": null
  }
}
```

Reject. `reviewComment` is required:

```json
{
  "review": {
    "status": "rejected",
    "reviewComment": "Please add DPO contact details before legal approval."
  }
}
```

Mark edited and export final files from DB content. `reviewComment` is required:

```json
{
  "review": {
    "status": "edited",
    "reviewComment": "Legal edited the retention and contact sections in the portal."
  }
}
```

Combined save-and-approve example:

```json
{
  "approvalDeadline": "2026-06-21T10:00:00Z",
  "content": {
    "language": "both",
    "contentTh": "# Final Thai policy\n\n...",
    "contentEn": "# Final English policy\n\n..."
  },
  "review": {
    "status": "approved",
    "reviewComment": null
  }
}
```

Rules:

- Legal identity is read from the authenticated legal token. Frontend must not send `editedBy`, `reviewedBy`, or `approvedBy`.
- Saving `content` sets `lastEditedBy` and `lastEditedAt` automatically.
- Any review decision sets `reviewedBy` and `reviewedAt` automatically.
- `approved` or `edited` sets `approvedBy` and `approvedAt` automatically.
- `approved`: `reviewComment` can be `null` or omitted.
- `rejected`: `reviewComment` must contain text.
- `edited`: `reviewComment` must contain text.
- `approved` and `edited`: backend creates final exports based on `exportFormat`.
- `rejected`: backend clears final export links and keeps the submission private.

Response 200: updated `SavedPolicy` object.

#### 2.12 Compatibility Legal Save Edited Content In DB
Prefer `PATCH /legal/submissions/:slug`. This old endpoint can remain for older frontend builds.

```http
PATCH /legal/submissions/:slug/content
Authorization: Bearer <legal_token>
Content-Type: application/json
```

Thai only:

```json
{
  "language": "th",
  "content": "# นโยบายความเป็นส่วนตัว\n\n..."
}
```

English only:

```json
{
  "language": "en",
  "content": "# Privacy Policy\n\n..."
}
```

Both languages:

```json
{
  "language": "both",
  "contentTh": "# นโยบายความเป็นส่วนตัว\n\n...",
  "contentEn": "# Privacy Policy\n\n..."
}
```

Response 200: updated `SavedPolicy` object.

#### 2.13 Compatibility Legal Review Action
Prefer `PATCH /legal/submissions/:slug`. This old endpoint can remain for older frontend builds.

```http
PATCH /legal/submissions/:slug/review
Authorization: Bearer <legal_token>
Content-Type: application/json
```

Approve and export final files from DB content. `reviewComment` can be `null`:

```json
{
  "status": "approved",
  "reviewComment": null,
  "syncGoogleDoc": false
}
```

Reject. `reviewComment` is required:

```json
{
  "status": "rejected",
  "reviewComment": "Please add DPO contact details",
  "syncGoogleDoc": false
}
```

Mark edited and export final files from DB content. `reviewComment` is required:

```json
{
  "status": "edited",
  "reviewComment": "Legal edited content in portal",
  "syncGoogleDoc": false
}
```

When status is `approved` or `edited`, backend creates final exports based on `exportFormat`.

Response 200 after approved/edited:

```json
{
  "id": "policy_uuid",
  "slug": "example-com-privacy-a1b2c3d4",
  "status": "approved",
  "shareUrls": {
    "th": "https://api.flowpdpa.co.th/example-com-privacy-a1b2c3d4",
    "en": "https://api.flowpdpa.co.th/example-com-privacy-a1b2c3d4/en"
  },
  "htmlEmbeds": {
    "th": "<iframe src=\"https://api.flowpdpa.co.th/example-com-privacy-a1b2c3d4\" width=\"100%\" height=\"800\" loading=\"lazy\"></iframe>",
    "en": "<iframe src=\"https://api.flowpdpa.co.th/example-com-privacy-a1b2c3d4/en\" width=\"100%\" height=\"800\" loading=\"lazy\"></iframe>"
  },
  "downloadsByLanguage": {
    "th": {
      "pdf": "signed-private-url-policy-th.pdf",
      "docx": "signed-private-url-policy-th.docx",
      "txt": "signed-private-url-policy-th.md",
      "html": "signed-private-url-policy-th.html"
    },
    "en": {
      "pdf": "signed-private-url-policy-en.pdf",
      "docx": "signed-private-url-policy-en.docx",
      "txt": "signed-private-url-policy-en.md",
      "html": "signed-private-url-policy-en.html"
    }
  }
}
```


#### 2.15 Delete / Archive Policy (Merchant)
This endpoint performs a soft delete. It does not physically delete the policy or its legal history from PostgreSQL.

```http
DELETE /policies/:policyId
Authorization: Bearer <merchant_token>
```

Backend behavior:

```text
policy.status = archived
-> policy is removed from GET /policies
-> public policy URLs stop working
-> generated policy row stays in PostgreSQL
-> policy_versions rows stay in PostgreSQL
-> policy_change_requests rows stay in PostgreSQL
```

Frontend behavior:

- Show a confirmation dialog before calling this endpoint.
- After success, remove the policy from the merchant's visible policy list.
- Do not show its share URL or download actions as active.
- Treat `status = archived` as deleted/inactive, not permanently erased.
- Do not call the public page after archival; it returns `404 POLICY_NOT_PUBLIC`.

Response 200:

```json
{
  "success": true,
  "data": {
    "policyId": "policy_uuid",
    "status": "archived"
  }
}
```

#### 2.16 Public Policy Page (No auth)
```http
GET /policies/public/:slug
GET /policies/public/:slug/en
GET /:slug
GET /:slug/en
```

Rules:
- `approved` and `edited` return public HTML.
- `pending_review`, `rejected`, and `archived` return `POLICY_NOT_PUBLIC`.

---
### 3. User Profile APIs

#### 3.1 Get User Profile
```http
GET /profile
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "id": "merchant_uuid",
    "name": "string",
    "email": "string",
    "plan": "Free",
    "function": "string",
    "phone": "string",
    "mobile": "string",
    "website": "string",
    "company_name": "string",
    "vat": "string",
    "address": {
      "street": "string",
      "street2": "string",
      "city": "string",
      "state": "string",
      "zip": "string",
      "country": "string"
    },
    "lang": "th_TH",
    "createdAt": "2026-05-23T10:00:00Z",
    "updatedAt": "2026-05-23T10:00:00Z"
  }
}
```

#### 3.2 Update User Profile
```http
PUT /profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "function": "string",
  "phone": "string",
  "mobile": "string",
  "website": "string",
  "company_name": "string",
  "vat": "string",
  "address": {
    "street": "string",
    "street2": "string",
    "city": "string",
    "state": "string",
    "zip": "string",
    "country": "string"
  },
  "lang": "th_TH"
}

Response 200 uses the same `data` shape as `GET /profile`.
```

#### 3.3 Change Password
```http
POST /profile/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "string",
  "newPassword": "string (min 8 chars)"
}

Response 200:
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

---

### 4. Stripe Billing APIs

`privacy` is free. The other policy types require independent monthly subscriptions. Prices and free/paid mapping are controlled by the backend; the frontend never submits an amount or Stripe Price ID.

#### 4.1 List Policy Products
```http
GET /billing/products
Authorization: Bearer <merchant_token>
```

Response 200:

```json
[
  {
    "policyType": "privacy",
    "name": "Privacy + Cookies Policy",
    "billingMode": "free",
    "interval": null,
    "checkoutAvailable": true
  },
  {
    "policyType": "dpa",
    "name": "Data Processing Agreement",
    "billingMode": "subscription",
    "interval": "month",
    "checkoutAvailable": true
  }
]
```

`checkoutAvailable=false` means the backend operator has not configured that policy type's Stripe Price ID yet.

#### 4.2 Create Stripe Checkout Session
```http
POST /billing/checkout-sessions
Authorization: Bearer <merchant_token>
Content-Type: application/json

{
  "policyType": "dpa"
}
```

Response 201:

```json
{
  "sessionId": "cs_...",
  "checkoutUrl": "https://checkout.stripe.com/...",
  "policyType": "dpa"
}
```

Rules:

- Backend chooses the Stripe Price ID from `policyType`.
- Checkout Session uses recurring subscription mode.
- Backend sets merchant ID and policy type as Stripe metadata.
- Success and cancel URLs come from trusted backend configuration, not arbitrary request URLs.

#### 4.3 Get Merchant Subscriptions
```http
GET /billing/subscriptions
GET /billing/subscriptions?policyType=dpa
Authorization: Bearer <merchant_token>
```

Response 200:

```json
[
  {
    "id": "subscription_uuid",
    "policyType": "dpa",
    "status": "active",
    "cancelAtPeriodEnd": false,
    "currentPeriodEnd": "2026-07-19T10:00:00Z"
  }
]
```

#### 4.4 Cancel Monthly Subscription
Merchant can cancel at any time. Cancellation is scheduled for the end of the current paid period by default.

```http
POST /billing/subscriptions/:subscriptionId/cancel
Authorization: Bearer <merchant_token>
Content-Type: application/json

{
  "atPeriodEnd": true
}
```

Response 200:

```json
{
  "id": "subscription_uuid",
  "status": "active",
  "cancelAtPeriodEnd": true,
  "currentPeriodEnd": "2026-07-19T10:00:00Z"
}
```

Cancellation behavior:

- Merchant keeps paid access until `currentPeriodEnd`.
- Merchant may undo scheduled cancellation before `currentPeriodEnd`.
- After expiration, existing paid public policy pages return `404 POLICY_NOT_PUBLIC`.
- After expiration, regeneration and new legal-change requests for that paid product return `402 SUBSCRIPTION_REQUIRED`.

#### 4.5 Resume Scheduled Cancellation
```http
POST /billing/subscriptions/:subscriptionId/resume
Authorization: Bearer <merchant_token>
```

Response 200 returns the subscription with `cancelAtPeriodEnd = false`.

#### 4.6 Create Stripe Customer Portal Session
```http
POST /billing/portal-sessions
Authorization: Bearer <merchant_token>
```

Response 201:

```json
{
  "portalUrl": "https://billing.stripe.com/..."
}
```

#### 4.7 Stripe Webhook
```http
POST /webhooks/stripe
Stripe-Signature: <stripe_signature>
```

No merchant authentication. Backend verifies the Stripe signature against the raw request body and processes events idempotently.

Required event handling:

- Checkout completed: link Stripe customer/subscription to merchant and policy type.
- Invoice paid: record successful renewal and keep entitlement active.
- Invoice payment failed: record failure and update billing status.
- Subscription updated: sync status, period end, and scheduled cancellation.
- Subscription deleted: expire entitlement.

Return `200` after successfully processing or safely ignoring an already-processed event.

---

### 5. Admin APIs

All routes require `Authorization: Bearer <admin_token>`. This table is the authoritative implemented Admin Portal contract; monetary values are Stripe minor units.

| Portal view | Endpoint | Purpose |
|---|---|---|
| Overview | `GET /admin/overview` | KPI, policy workflow totals, recent payments/errors |
| Merchants | `GET /admin/merchants` | Search/filter/paginate merchant accounts |
| Merchant detail | `GET /admin/merchants/:merchantId` | Profile, subscriptions, payments, policies |
| Merchant status | `PUT /admin/merchants/:merchantId/status` | Activate, suspend, set pending/inactive |
| Subscriptions | `GET /admin/subscriptions` | Read-only Stripe subscription monitoring |
| Payments | `GET /admin/payments` | Read-only Stripe invoice monitoring |
| Policies | `GET /admin/policies` | Search/filter/paginate all policy workflows |
| Policy detail | `GET /admin/policies/:policyId` | Inspect form/review/assignment metadata |
| Error Logs | `GET /admin/monitoring/logs` | Sanitized operational errors |
| Analytics | `GET /admin/analytics` | Revenue, growth, churn, policy and risk analytics |
| Legal Management | `/admin/legal-*`, `/admin/legal-users*` | Legal users, workload, history |

The older sample payloads below are illustrative. Implemented responses use the field descriptions stated under each endpoint and do not include scan quota, LINE, or fictional Starter/Pro plan metrics.

#### 5.1 Admin Overview
Returns active merchant/subscription counts, Stripe revenue, pending payments, pending and unassigned legal reviews, active errors, policy status totals, and five recent payments/errors.
```http
GET /admin/overview
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "data": {
    "kpi": {
      "activeMerchants": 142,
      "totalRevenue": 425000,
      "pendingPayments": 3,
      "activeErrors": 5
    },
    "scanActivity": {
      "today": 1204,
      "month": 28450,
      "errorRate": 1.2
    },
    "planDistribution": {
      "Pro": 45,
      "Starter": 67,
      "Free": 30
    },
    "recentPayments": [ ... ],
    "recentErrors": [ ... ]
  }
}
```

#### 5.2 List Merchants
Supports `status`, `search`, `page`, and `limit`. Each item includes profile data, policy count, active subscriptions, creation time, and last login.
```http
GET /admin/merchants?status=active&search=query&page=1&limit=50
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "data": {
    "merchants": [
      {
        "id": "M001",
        "shopName": "ร้านดอกไม้ขอนแก่น",
        "ownerEmail": "flower@shop.th",
        "status": "active",
        "plan": "Pro",
        "totalScans": 342,
        "quota": 1000,
        "used": 342,
        "lineConnected": true,
        "createdAt": "2024-01-15T00:00:00Z"
      }
    ]
  }
}
```

#### 5.3 Get Merchant Details
Returns profile data, subscriptions, the latest 50 payments, and latest 50 policies.
```http
GET /admin/merchants/:merchantId
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "data": {
    "merchant": {
      "id": "M001",
      "shopName": "...",
      "ownerEmail": "...",
      "subscription": {
        "plan": "Pro",
        "status": "active",
        "billingCycle": "monthly",
        "expiresAt": "2025-06-15",
        "amount": 799
      },
      "paymentHistory": [ ... ]
    }
  }
}
```

#### 5.4 Update Merchant Status
Allowed values are `active`, `suspended`, `pending`, and `inactive`. Non-active merchants cannot authenticate or continue using an existing token.
```http
PUT /admin/merchants/:merchantId/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "suspended"
}

Response 200:
{
  "success": true,
  "data": {
    "updated": true
  }
}
```

#### 5.5 List Subscriptions
Supports `status`, `policyType`, `page`, and `limit`. This is read-only; Stripe webhooks own subscription state.
```http
GET /admin/subscriptions?status=active&policyType=dpa&page=1&limit=50
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "data": {
    "subscriptions": [ ... ]
  }
}
```

#### 5.6 List Payments
Supports `status`, `page`, and `limit`. Returns Stripe invoice records and collected/pending/failed totals. Admin cannot mark an invoice paid.
```http
GET /admin/payments?status=paid&page=1&limit=50
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "PAY001",
        "merchantName": "...",
        "amount": 799,
        "gateway": "stripe",
        "policyType": "dpa",
        "status": "paid",
        "createdAt": "2026-05-23T10:00:00Z"
      }
    ],
    "summary": {
      "totalCollected": 425000,
      "pending": 3,
      "failed": 1
    }
  }
}
```

Stripe webhook events update payment/subscription status. Admin endpoints are read-only monitoring APIs and must not manually mark Stripe invoices paid.

#### 5.6.1 Policies
```http
GET /admin/policies?status=pending_review&policyType=privacy&merchantId=:merchantId&search=query&page=1&limit=50
GET /admin/policies/:policyId
Authorization: Bearer <admin_token>
```

Admin can inspect merchant ownership, form metadata, workflow status, assignment, deadline, review metadata, and read-only `contentTh` / `contentEn`. Admin cannot edit legal policy content.

#### 5.7 Error Logs
Supports `level`, `service`, `page`, and `limit`. Stored context contains request method/path only; request bodies and authorization headers are not persisted.
```http
GET /admin/monitoring/logs?level=critical&service=stripe_billing&page=1&limit=50
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "LOG001",
        "level": "critical",
        "service": "payment_gateway",
        "message": "...",
        "merchantId": "M006",
        "createdAt": "2026-05-23T10:00:00Z"
      }
    ],
    "summary": {
      "critical": 2,
      "error": 8,
      "warning": 15
    }
  }
}
```

#### 5.8 Analytics
Returns total/current-month Stripe revenue, revenue by policy type, merchant growth, subscription churn, policies by type/status, top merchants, and at-risk subscriptions.
```http
GET /admin/analytics
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "data": {
    "revenue": {
      "total": 425000,
      "mrr": 63500,
      "byPlan": {
        "Pro": 280000,
        "Starter": 145000,
        "Free": 0
      }
    },
    "growth": {
      "mom": "+12.4%",
      "newMerchants": 3,
      "churned": 1
    },
    "topMerchants": [ ... ],
    "atRiskMerchants": [ ... ]
  }
}
```

#### 5.9 List Legal Users
```http
GET /admin/legal-users?status=active&search=query
Authorization: Bearer <admin_token>
```

Returns legal profiles with `pendingReviews`, `approvedCount`, `rejectedCount`, and `editedCount`.

#### 5.10 Create Legal User
```http
POST /admin/legal-users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Legal Reviewer",
  "email": "legal2@flowpdpa.co.th",
  "password": "securePassword123",
  "phone": "0812345678",
  "status": "active"
}
```

Creates a `merchants` row with `role = legal`. The backend hashes the password.

#### 5.11 Get Legal User Detail
```http
GET /admin/legal-users/:legalUserId
Authorization: Bearer <admin_token>
```

Returns profile, workload totals, and the 20 most recent review events.

#### 5.12 Update Legal User
```http
PUT /admin/legal-users/:legalUserId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Senior Legal Reviewer",
  "email": "senior.legal@flowpdpa.co.th",
  "phone": "0899999999",
  "roleLevel": "senior"
}
```

Fields are optional, but at least one is required. This endpoint cannot change policy content.

#### 5.13 Update Legal User Status
```http
PUT /admin/legal-users/:legalUserId/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "suspended"
}
```

Allowed values: `active`, `suspended`, `inactive`. Non-active legal users cannot log in, use an existing legal token, or receive assignments.

#### 5.14 Manually Reassign Policy to Legal Reviewer
```http
PUT /admin/policies/:policyId/assign-legal
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "legalUserId": "legal_uuid",
  "note": "Urgent client. Please review within 24 hours."
}
```

Normal submissions are assigned automatically using least pending workload. This endpoint is an optional Admin override for urgent work, staff leave, or workload correction. Only active legal users can receive assignments.

#### 5.15 Legal Workload Overview
```http
GET /admin/legal-workload
Authorization: Bearer <admin_token>
```

Returns total and active legal users, pending and overdue reviews, monthly approvals, and average review time per reviewer.

#### 5.16 Legal Review History
```http
GET /admin/legal-reviews?legalUserId=:legalUserId&status=approved&page=1&limit=50
Authorization: Bearer <admin_token>
```

Allowed status filters: `approved`, `rejected`, `edited`. Results come from immutable `legal_review_events`.

Admin Legal Management rules:

- Admin manages legal accounts, status, assignments, workload, and review history.
- Admin does not edit `content_th` or `content_en` through these endpoints.
- Legal editor/reviewer identity comes from the authenticated token.
- Legal content and review decisions remain under `/legal/*`.

---

## Database Schema

### Tables Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. merchants        ──── User/Merchant accounts                        │
│  2. merchant_profiles ──── Extended profile information                 │
│  3. policies         ──── Generated policy records                      │
│  4. policy_versions  ──── Policy version history                        │
│  5. policy_change_requests ──── Merchant-to-legal policy changes        │
│  6. subscriptions    ──── Subscription records                          │
│  7. payments         ──── Payment records                               │
│  8. stripe_webhook_events ──── Stripe webhook idempotency                │
│  9. error_logs       ──── System error logs                             │
│ 10. audit_logs       ──── Audit trail                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Table Definitions

#### 1. merchants
```sql
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'Free', -- 'Free', 'Premium'
  role VARCHAR(50) NOT NULL DEFAULT 'merchant', -- 'merchant', 'admin', 'legal'
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'inactive', 'pending'
  
  -- OAuth (for future)
  provider VARCHAR(100),
  provider_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_merchants_email ON merchants(email);
CREATE INDEX idx_merchants_plan ON merchants(plan);
CREATE INDEX idx_merchants_status ON merchants(status);
```

#### 2. merchant_profiles
```sql
CREATE TABLE merchant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Contact
  phone VARCHAR(50),
  mobile VARCHAR(50),
  website VARCHAR(255),
  
  -- Company
  company_name VARCHAR(255),
  tax_id VARCHAR(50),
  
  -- Address
  street VARCHAR(255),
  street2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip VARCHAR(20),
  country VARCHAR(100) DEFAULT 'ประเทศไทย',
  
  -- Preferences
  language VARCHAR(10) DEFAULT 'th_TH', -- 'th_TH', 'en_US'
  
  -- LINE Integration (for future)
  line_connected BOOLEAN DEFAULT false,
  line_user_id VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_merchant_profiles_merchant_id ON merchant_profiles(merchant_id);
```

#### 3. policies
```sql
CREATE TYPE policy_type AS ENUM ('privacy', 'hr', 'cctv', 'recruitment', 'vendor', 'dpa');
CREATE TYPE policy_status AS ENUM ('draft', 'active', 'archived', 'pending_review', 'approved', 'rejected', 'edited');

CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- Policy Info
  name VARCHAR(255) NOT NULL,
  type policy_type NOT NULL DEFAULT 'privacy',
  status policy_status NOT NULL DEFAULT 'pending_review',
  slug VARCHAR(255) UNIQUE NOT NULL,

  -- Original merchant request
  form_data JSONB NOT NULL,

  -- DB content is the source of truth before and after legal review
  content_th TEXT,
  content_en TEXT,

  -- Public URL base; public page is available only when status is approved/edited
  share_url VARCHAR(500),

  -- Final private export object keys / signed download sources (created after approval)
  download_url_pdf VARCHAR(500),
  download_url_docx VARCHAR(500),
  download_url_txt VARCHAR(500),
  html_embed_code TEXT,
  download_url_pdf_en VARCHAR(500),
  download_url_docx_en VARCHAR(500),
  download_url_txt_en VARCHAR(500),
  html_embed_code_en TEXT,

  -- Template / AI metadata
  template_id VARCHAR(100) NOT NULL DEFAULT 'legacy',
  template_version VARCHAR(50) NOT NULL DEFAULT 'legacy',
  reference_key VARCHAR(500),
  ai_provider VARCHAR(100),
  ai_model VARCHAR(100),

  -- Legal review metadata
  review_comment TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by VARCHAR(255),
  last_edited_by VARCHAR(255),
  last_edited_at TIMESTAMP WITH TIME ZONE,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  assigned_legal_user_id UUID REFERENCES merchants(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  assigned_by UUID REFERENCES merchants(id),
  assignment_note TEXT,
  approval_deadline TIMESTAMP WITH TIME ZONE,
  google_doc_id VARCHAR(255),
  google_doc_url VARCHAR(1000),

  -- Versioning and timestamps
  version INTEGER NOT NULL DEFAULT 1,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_policies_merchant_id ON policies(merchant_id);
CREATE INDEX idx_policies_slug ON policies(slug);
CREATE INDEX idx_policies_type ON policies(type);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_assigned_legal_user_id ON policies(assigned_legal_user_id);
```
#### 4. policy_versions
```sql
CREATE TABLE policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  
  -- Snapshot
  form_data JSONB NOT NULL,
  content_th TEXT,
  content_en TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES merchants(id)
);

CREATE INDEX idx_policy_versions_policy_id ON policy_versions(policy_id);
CREATE UNIQUE INDEX idx_policy_versions_policy_version ON policy_versions(policy_id, version);
```

#### 4.1 legal_review_events
Immutable audit history. The backend inserts one row for every legal approval, rejection, edit, or resolved change request.

```sql
CREATE TABLE legal_review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  legal_user_id UUID REFERENCES merchants(id),
  legal_user_email VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  comment TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_legal_review_events_policy_id ON legal_review_events(policy_id);
CREATE INDEX idx_legal_review_events_legal_user_id ON legal_review_events(legal_user_id);
CREATE INDEX idx_legal_review_events_reviewed_at ON legal_review_events(reviewed_at);
```

#### 5. policy_change_requests
```sql
CREATE TYPE policy_change_request_status AS ENUM ('merchant_review', 'merchant_rejected', 'pending_review', 'resolved', 'rejected');
CREATE TYPE policy_change_request_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE policy_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- Which policy content should legal edit?
  policy_slug VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'th', -- th, en, both
  section_title VARCHAR(500),
  selected_text TEXT,
  line_start INTEGER,
  line_end INTEGER,

  -- Customer/requester info
  requester_name VARCHAR(255),
  requester_email VARCHAR(255),

  -- Customer request
  requested_change TEXT NOT NULL,
  reason TEXT,
  priority policy_change_request_priority NOT NULL DEFAULT 'normal',
  status policy_change_request_status NOT NULL DEFAULT 'merchant_review',

  -- Merchant review
  merchant_comment TEXT,
  merchant_reviewed_at TIMESTAMP WITH TIME ZONE,
  merchant_reviewed_by UUID REFERENCES merchants(id),

  -- Legal resolution
  legal_comment TEXT,
  resolved_policy_version INTEGER,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES merchants(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_policy_change_requests_policy_id ON policy_change_requests(policy_id);
CREATE INDEX idx_policy_change_requests_merchant_id ON policy_change_requests(merchant_id);
CREATE INDEX idx_policy_change_requests_status ON policy_change_requests(status);
CREATE INDEX idx_policy_change_requests_policy_slug ON policy_change_requests(policy_slug);
```

#### 6. subscriptions
Stores one Stripe subscription entitlement per merchant and paid policy type.

```sql
CREATE TYPE sub_status AS ENUM ('incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'paused', 'cancelled');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  policy_type VARCHAR(50) NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_price_id VARCHAR(255) NOT NULL,
  status sub_status NOT NULL DEFAULT 'incomplete',
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  unit_amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'thb',
  interval VARCHAR(20) NOT NULL DEFAULT 'month',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_subscriptions_merchant_id ON subscriptions(merchant_id);
CREATE INDEX idx_subscriptions_policy_type ON subscriptions(policy_type);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
```

#### 7. payments
Stores Stripe invoice payment outcomes for subscription renewals.

```sql
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'void');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  policy_type VARCHAR(50) NOT NULL,
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'thb',
  status payment_status NOT NULL DEFAULT 'pending',
  hosted_invoice_url VARCHAR(1000),
  invoice_pdf_url VARCHAR(1000),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
```

#### 8. stripe_webhook_events
Stores processed Stripe event IDs so webhook retries are idempotent.

```sql
CREATE TABLE stripe_webhook_events (
  stripe_event_id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(255) NOT NULL,
  stripe_object_id VARCHAR(255),
  processing_status VARCHAR(20) NOT NULL DEFAULT 'processed',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX idx_stripe_webhook_events_processed_at ON stripe_webhook_events(processed_at);
```

#### 9. error_logs
```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  
  level VARCHAR(20) NOT NULL DEFAULT 'error', -- info, warning, error, critical
  service VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  
  -- Context
  context JSONB,
  stack_trace TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_error_logs_level ON error_logs(level);
CREATE INDEX idx_error_logs_service ON error_logs(service);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX idx_error_logs_merchant_id ON error_logs(merchant_id);
```

#### 10. audit_logs
```sql
CREATE TYPE audit_action AS ENUM (
  'create', 'update', 'delete', 'login', 'logout', 
  'policy_generate', 'policy_download', 'subscription_change',
  'payment_approve', 'merchant_suspend'
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  
  action audit_action NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  changes JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_merchant_id ON audit_logs(merchant_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## AI Integration Requirements

### Overview: Template-Based Policy Customization

**Important:** The system does **NOT** generate policies from scratch. Instead, it uses **pre-approved legal templates** and uses AI to intelligently customize them based on the client's form data.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    POLICY GENERATION APPROACH                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. SELECT BASE TEMPLATE                                               │
│     Based on policyType (privacy, hr, cctv, etc.)                      │
│     └─→ Load lawyer-approved template from database/files             │
│                                                                         │
│  2. AI ANALYZES CLIENT DATA                                            │
│     • Reads form data (business info, data types, purposes, etc.)     │
│     • Understands which clauses apply to this specific client         │
│                                                                         │
│  3. AI CUSTOMIZES TEMPLATE                                             │
│     • Fills in placeholders with client data                           │
│     • Includes/excludes clauses based on data collected               │
│     • Adds required sections (e.g., cookie policy, sensitive data)    │
│     • Applies the legal requirements configured for the product       │
│     • Translates to English when requested by the policy product      │
│                                                                         │
│  4. OUTPUT: Personalized Policy                                        │
│     └─→ Legal template + Client-specific customization                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Template Storage Structure

```typescript
// Templates are stored as files or in database
interface PolicyTemplate {
  id: string;
  policyType: 'privacy' | 'hr' | 'cctv' | 'recruitment' | 'vendor' | 'dpa';
  language: 'th' | 'en';
  version: string;
  
  // Template with placeholders
  content: string;  // Contains {{placeholders}} for AI to fill
  
  // Conditional sections (AI decides whether to include)
  sections: {
    cookies: {          // Include if hasCookies = true
      required: boolean;
      content: string;
    };
    userAccounts: {     // Include if hasUserAccounts = true
      required: boolean;
      content: string;
    };
    sensitiveData: {    // Include if sensitive data types selected
      required: boolean;
      content: string;
    };
    thirdPartySharing: {
      required: boolean;  // Include if thirdParties not empty
      content: string;
    };
    // ... more sections
  };
  
  // Metadata
  compliance: ['PDPA Thailand', 'GDPR', 'CCPA'];  // Which standards
  approvedBy: 'Legal Team / Lawyer Name';
  approvedAt: string;
}
```

### Template Example (Privacy Policy - Thai)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POLICY TEMPLATE: Privacy + Cookies Policy (Thai)
Version: 1.0 | Approved: 2024-01-15
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

นโยบายความเป็นส่วนตัว

วันที่ {{currentDate}}

บริษัท {{companyName}} ("เรา") มุ่งมั่นที่จะคุ้มครองข้อมูลส่วนบุคคลของท่าน
ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)

1. ผู้ควบคุมข้อมูลส่วนบุคคล
   เราคือผู้ควบคุมข้อมูลส่วนบุคคล สามารถติดต่อเราได้ที่:
   - ชื่อ: {{companyName}}
   - เว็บไซต์: {{websiteUrl}}
   - อีเมล: {{contactEmail}}
   {{#if contactPhone}}- โทร: {{contactPhone}}{{/if}}
   {{#if address}}- ที่อยู่: {{address}}{{/if}}

2. ข้อมูลส่วนบุคคลที่เราเก็บรวบรวม

   เราอาจเก็บรวบรวมข้อมูลส่วนบุคคลดังนี้:

   {{#each dataTypes}}
   • {{@keyToLabel(this)}}
   {{/each}}

   {{#if sensitiveData}}
   ข้อมูลอ่อนไหว (Data Sensitive):
   {{#each sensitiveData}}
   • {{@keyToLabel(this)}} - ข้อมูลนี้เป็นข้อมูลอ่อนไหวตาม PDPA
   {{/each}}
   เราจะขอความยินยอมโดยเฉพาะก่อนเก็บรวบรวมข้อมูลดังกล่าว
   {{/if}}

3. วัตถุประสงค์ในการเก็บรวบรวมและใช้ข้อมูล

   เราเก็บรวบรวมและใช้ข้อมูลส่วนบุคคลของท่านเพื่อวัตถุประสงค์ดังนี้:

   {{#each purposes}}
   • {{@keyToLabel(this)}}
   {{/each}}

   ฐานทางกฎหมายในการประมวลผลข้อมูล:
   - ความยินยอมของเจ้าของข้อมูล (Section 19)
   - การปฏิบัติตามสัญญา (Section 24)
   {{#if hasUserAccounts}}- ประโยชน์อันดียง legitimate (Section 24){{/if}}

4. การเปิดเผยข้อมูลแก่บุคคลที่สาม

   {{#if thirdParties.length}}
   เราอาจเปิดเผยข้อมูลของท่านแก่บุคคลที่สามดังนี้:
   
   {{#each thirdParties}}
   • {{@keyToLabel(this)}} - วัตถุประสงค์: {{@purposeFor(this)}}
   {{/each}}
   {{else}}
   เราไม่มีการเปิดเผยข้อมูลแก่บุคคลที่สาม
   {{/if}}

   {{include section="cookies" if="hasCookies"}}

   {{include section="userAccounts" if="hasUserAccounts"}}

5. ระยะเวลาในการเก็บรักษาข้อมูล

   เราจะเก็บรักษาข้อมูลส่วนบุคคลของท่านเป็นเวลา {{retentionPeriod}}
   หรือตามที่กฎหมายกำหนด หลังจากนั้นเราจะทำลายหรือทำให้
   ข้อมูลดังกล่าวไม่สามารถระบุตัวตนเจ้าของข้อมูลได้

6. สิทธิของเจ้าของข้อมูลส่วนบุคคล

   ตาม PDPA ท่านมีสิทธิดังนี้:
   • สิทธิในการขอเข้าถึงข้อมูลส่วนบุคคล (Right of Access)
   • สิทธิในการขอทำสำเนา (Right to Obtain Copy)
   • สิทธิในการขอแก้ไข (Right to Rectification)
   • สิทธิในการขอลบ (Right to Erasure)
   • สิทธิในการขอให้แจ้ง (Right to Portability)
   • สิทธิในการขอคัดค้าน (Right to Object)
   • สิทธิในการถอนความยินยอม (Right to Withdraw Consent)

   สามารถติดต่อขอใช้สิทธิดังกล่าวได้ที่: {{dpoEmail}}

7. การแจ้งเหตุละเมิดข้อมูลส่วนบุคคล

   ในกรณีที่เกิดเหตุละเมิดข้อมูลส่วนบุคคล เราจะแจ้ง
   สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคลภายใน 72 ชั่วโมง
   และแจ้งเจ้าของข้อมูลโดยไม่ชักช้า

8. การเปลี่ยนแปลงนโยบาย

   เราขอสงวนสิทธิในการแก้ไขเปลี่ยนแปลงนโยบายฉบับนี้
   โดยจะแจ้งให้ท่านทราบล่วงหน้าผ่านเว็บไซต์หรืออีเมล

9. ติดต่อเรา

   หากท่านมีข้อสงสัยเกี่ยวกับนโยบายฉบับนี้ หรือต้องการ
   ใช้สิทธิตาม PDPA สามารถติดต่อเจ้าหน้าที่คุ้มครองข้อมูล
   (Data Protection Officer) ได้ที่:
   - อีเมล: {{dpoEmail}}
   {{#if contactPhone}}- โทร: {{contactPhone}}{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### AI Customization Process

```typescript
interface AICustomizationRequest {
  // The base template
  template: PolicyTemplate;
  
  // Client form data
  formData: {
    policyType: string;
    websiteName: string;
    websiteUrl: string;
    businessType: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    dataTypes: string[];
    hasCookies: boolean;
    hasUserAccounts: boolean;
    purposes: string[];
    thirdParties: string[];
    dpoEmail?: string;
    retentionPeriod: string;
  };
  
  // User plan (determines what's included)
  plan: 'Free' | 'Premium';
  
  // Language preference
  language: 'th' | 'en' | 'both';
}
```

### AI Prompt for Template Customization

```
You are a legal document assistant. Your task is to customize a legal template
based on client information. DO NOT change the legal wording or structure of
the template - only fill in placeholders and include/exclude conditional sections.

BASE TEMPLATE:
[Insert the complete template here]

CLIENT INFORMATION:
- Company Name: {{websiteName}}
- Website: {{websiteUrl}}
- Business Type: {{businessType}}
- Contact Email: {{contactEmail}}
- Contact Phone: {{contactPhone}}
- Address: {{address}}

DATA COLLECTED:
{{#each dataTypes}}
- {{this}}
{{/each}}

SENSITIVE DATA:
{{#if sensitiveData}}
{{#each sensitiveData}}
- {{this}}
{{/each}}
{{/if}}

HAS COOKIES: {{hasCookies}}
HAS USER ACCOUNTS: {{hasUserAccounts}}

PURPOSES:
{{#each purposes}}
- {{this}}
{{/each}}

THIRD PARTIES:
{{#each thirdParties}}
- {{this}}
{{/each}}

DPO EMAIL: {{dpoEmail}}
RETENTION PERIOD: {{retentionPeriod}}

INSTRUCTIONS:
1. Replace all {{placeholders}} with actual client data
2. Include sections that apply based on client data:
   - Include Cookie Policy if hasCookies = true
   - Include User Accounts section if hasUserAccounts = true
   - Include Sensitive Data clauses if sensitiveData is not empty
   - Include Third Party Sharing if thirdParties is not empty
3. Remove any sections marked as "include if" that don't apply
4. Keep all legal wording EXACTLY as in the template
5. Only translate to English if language = 'en' or 'both'
6. Include additional compliance clauses only when defined by the selected policy product/template

Return the complete customized policy.
```

### AI Response Expected Format

```typescript
interface AICustomizedPolicy {
  contentTh: string;      // Customized Thai policy
  contentEn?: string;     // Included when language is "en" or "both"
  metadata: {
    templateId: string;        // Which template was used
    templateVersion: string;   // Template version
    sectionsIncluded: string[]; // Which conditional sections were included
    sectionsExcluded: string[]; // Which were excluded
    warnings?: string[];        // Any warnings (e.g., missing required info)
  };
}
```

### Backend Process Flow

```typescript
async function createPolicySubmission(formData: FormData, currentUser: User): Promise<SavedPolicy> {
  // 1. Load approved legal template/reference
  const template = await loadTemplate(formData.policyType, 'th', formData.templateVersion);
  const legalReference = await loadLegalReference('pdpa-framework-v1');

  // 2. AI customizes Thai policy from merchant form data
  const contentTh = await aiCustomizePolicy(template, legalReference, formData);

  // 3. If English or both is requested, create a separate English version
  const contentEn = ['en', 'both'].includes(formData.language)
    ? await aiTranslatePolicyToEnglish(contentTh)
    : null;

  // 4. Save DB draft only. Do not export files yet.
  const policy = await savePolicy({
    merchantId: currentUser.id,
    formData,
    contentTh,
    contentEn,
    status: 'pending_review',
    approvalDeadline: addDays(now(), 2)
  });

  return toSavedPolicy(policy);
}

async function legalSaveContent(slug: string, body: LegalContentUpdate): Promise<SavedPolicy> {
  // Legal portal editor saves Markdown directly into DB.
  return await updatePolicyContent(slug, body.language, body.content, body.contentTh, body.contentEn);
}

async function legalReview(slug: string, body: LegalReviewRequest): Promise<SavedPolicy> {
  // Legal can approve/reject/mark edited.
  // If approved or edited, exports are generated from final DB content.
  const policy = await updateReviewStatus(slug, body.status, body.reviewComment);

  if (body.status === 'approved' || body.status === 'edited') {
    await generateFinalExports(policy); // PDF, DOCX, TXT, HTML per language
  }

  return toSavedPolicy(policy);
}
```
### AI Service Recommendations

1. **OpenAI GPT-4** - Best for template customization
   - API: `https://api.openai.com/v1/chat/completions`
   - Model: `gpt-4-turbo` (follows instructions well)

2. **Anthropic Claude** - Excellent at following formatting rules
   - API: `https://api.anthropic.com/v1/messages`
   - Model: `claude-3-5-sonnet-20241022` (great for document tasks)

3. **Local LLaMA** - For cost-effective option (optional)
   - Self-hosted for data privacy
   - Lower cost but may require fine-tuning

### Fallback Strategy (If AI Fails)

```typescript
// If AI service fails, do simple string replacement
function customizeTemplateFallback(template: string, data: FormData): string {
  let result = template;
  
  // Simple replacements
  result = result.replace(/\{\{companyName\}\}/g, data.websiteName);
  result = result.replace(/\{\{websiteUrl\}\}/g, data.websiteUrl);
  result = result.replace(/\{\{contactEmail\}\}/g, data.contactEmail);
  // ... more replacements
  
  // Handle conditional sections
  if (!data.hasCookies) {
    result = removeSection(result, 'cookies');
  }
  if (!data.hasUserAccounts) {
    result = removeSection(result, 'userAccounts');
  }
  // ... more conditions
  
  return result;
}
```

---

## Response/Request Formats

### Standard Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_REQUEST` | 400 | Missing or invalid parameters |
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `PAYMENT_REQUIRED` | 402 | Future billing only: selected policy type requires Stripe Checkout |
| `SUBSCRIPTION_REQUIRED` | 402 | Active monthly subscription required for this paid policy type |
| `SUBSCRIPTION_PAST_DUE` | 402 | Future billing only: Stripe subscription payment is past due |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Validation Rules

| Field | Rules |
|-------|-------|
| email | Valid email format, max 255 chars |
| password | Min 6 chars, hashed with bcrypt |
| websiteUrl | Valid URL format |
| policyType | One of: privacy, hr, cctv, recruitment, vendor, dpa |
| businessType | One of: 'ร้านค้าออนไลน์ (E-Commerce)', 'บริษัทจำกัด / บริษัทมหาชน', 'SME / วิสาหกิจขนาดกลางและเล็ก', 'สตาร์ทอัป (Startup)', 'ฟรีแลนซ์ / บุคคลธรรมดา', 'หน่วยงานราชการ / NGO', 'คลินิก / โรงพยาบาล', 'สถาบันการศึกษา', 'อื่นๆ' |
| language | One of: th, en, both |
| dataTypes | At least 1 required. Options: name, email, phone, address, payment, idcard, dob, location, behavior, ip, health, religion, biometric |
| purposes | At least 1 required. Options: service, order, contact, payment, marketing, analytics, legal, security |
| thirdParties | Options: ga, gtm, gads, fb, line, stripe, omise, aws, mailchimp, zendesk |
| exportFormat | Options: PDF, Word (.docx), TXT, HTML Embed |
| retentionPeriod | One of: '1 ปี', '2 ปี', '3 ปี', '5 ปี', '7 ปี (ตามกฎหมายภาษี)', '10 ปี', 'ตลอดระยะเวลาการใช้บริการ' |

---

## Deployment Checklist

- [ ] Set up PostgreSQL database with above schema
- [ ] Configure JWT secret and expiration
- [ ] Set up AI service API key (OpenAI/Anthropic)
- [ ] Configure Stripe secret key and webhook signing secret
- [ ] Configure one Stripe recurring Price ID for each paid `policyType`
- [ ] Configure Stripe Checkout success/cancel URLs and Customer Portal return URL
- [ ] Register Stripe webhook endpoint and required events
- [ ] Configure CDN for policy downloads (PDF, DOCX)
- [ ] Set up email service for notifications (optional)
- [ ] Configure rate limiting
- [ ] Set up logging and monitoring
- [ ] Configure CORS for frontend domain
- [ ] Set up backup strategy
- [ ] Configure SSL/TLS certificates

---

## Notes for Backend Team

1. **Accounts**: Merchant, admin, and legal accounts are database users distinguished by `role`; do not hardcode production credentials.
2. **Policy Generation**: The current API waits for generation and returns the saved `pending_review` policy.
3. **Exports**: Generate PDF, DOCX, TXT, and private HTML after legal approval.
4. **Slug Generation**: Use `{domain-sanitized}-{policy-type}-{short-id}` to avoid collisions.
5. **Thai Language Support**: Ensure all strings and generated files use UTF-8.

---

**Document Version:** 1.1  
**Last Updated:** 2026-06-20  
**Questions?** Contact: tech@flowpdpa.co.th
