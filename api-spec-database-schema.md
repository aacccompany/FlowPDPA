# FlowPDPA — Backend API Specification & Database Schema

**Version:** 1.0  
**Date:** 2026-05-23  
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
https://api.flowpdpa.co.th/v1
```

### Authentication
- **Method:** JWT Bearer Token
- **Header:** `Authorization: Bearer <token>`
- **Token Expiry:** 7 days (configurable)

### Response Format (Standard)
```json
{
  "success": true|false,
  "data": {},
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  },
  "meta": {
    "timestamp": "2026-05-23T10:00:00Z",
    "requestId": "req_xxxxxxxxx"
  }
}
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. REGISTER (New User)                                                │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ POST /auth/register                                             │ │
│     │ Request: { name, email, password }                              │ │
│     │ Response: { user, token, plan: "Free" }                         │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ • Create user record with plan="Free"                           │ │
│     │ • Hash password (bcrypt)                                        │ │
│     │ • Generate JWT token                                            │ │
│     │ • Return token + user profile                                   │ │
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
│     │ Demo User Check:                                                │ │
│     │ • email="demo@flowpdpa.co.th", password="demo1234"              │ │
│     │ • Returns plan="Premium" hardcoded                              │ │
│     │                                                                 │ │
│     │ Regular User:                                                    │ │
│     │ • Verify password hash                                          │ │
│     │ • Generate JWT token with: { sub, merchant_id, role, plan }    │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  3. ADMIN LOGIN                                                        │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ POST /auth/admin-login                                         │ │
│     │ Request: { email: "admin@flowpdpa.co.th", password }           │ │
│     │ Response: { token, role: "admin" }                              │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ • Verify hardcoded credentials                                  │ │
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
│  │ API: POST /policies/generate                                    │   │
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
│  │    • Check user plan permissions (Free vs Premium features)     │   │
│  │                                                                 │   │
│  │ 2. PREPARE AI PROMPT                                            │   │
│  │    • Build structured prompt from form data                     │   │
│  │    • Include legal requirements (PDPA Thailand)                 │   │
│  │    • Add GDPR/CCPA if Premium plan                              │   │
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
│  │ 5. GENERATE EXPORT FILES                                        │   │
│  │    • Convert to PDF                                             │   │
│  │    • Convert to Word (.docx)                                    │   │
│  │    • Generate HTML embed code                                   │   │
│  │    • Generate TXT version                                       │   │
│  │                                                                 │   │
│  │ 6. RETURN RESPONSE                                              │   │
│  │    • Policy ID, URL, download links                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ FRONTEND: Success Screen                                        │   │
│  │ • Show policy generated message                                 │   │
│  │ • Display shareable URL: flowpdpa.co.th/p/{slug}               │   │
│  │ • Download buttons (PDF, Word, TXT)                             │   │
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
  "password": "string (required, min 6 chars)",
  "confirm": "string (required, must match password)"
}

Response 200:
{
  "success": true,
  "data": {
    "user": {
      "id": "merchant_uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "08x-xxx-xxxx",
      "company": "My Company Ltd.",
      "plan": "Free",
      "createdAt": "2026-05-23T10:00:00Z"
    },
    "token": "jwt_token_string"
  }
}
```

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
      "phone": "02-xxx-xxxx"
    },
    "token": "jwt_token_string"
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

#### 1.3 Admin Login
```http
POST /auth/admin-login
Content-Type: application/json

{
  "email": "admin@flowpdpa.co.th",
  "password": "admin2025"
}

Response 200:
{
  "success": true,
  "data": {
    "token": "jwt_admin_token",
    "role": "admin"
  }
}
```

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

---

### 2. Policy APIs

#### 2.1 Generate Policy (AI-powered)
```http
POST /policies/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "policyType": "privacy" | "hr" | "cctv" | "recruitment" | "vendor" | "dpa",
  "agreedToTerms": true,
  
  // Step 2: Business Info
  "websiteName": "string (required)",
  "websiteUrl": "string (required, url format)",
  "businessType": "string (required)", // One of: 'ร้านค้าออนไลน์ (E-Commerce)', 'บริษัทจำกัด / บริษัทมหาชน', 'SME / วิสาหกิจขนาดกลางและเล็ก', 'สตาร์ทอัป (Startup)', 'ฟรีแลนซ์ / บุคคลธรรมดา', 'หน่วยงานราชการ / NGO', 'คลินิก / โรงพยาบาล', 'สถาบันการศึกษา', 'อื่นๆ'
  "contactEmail": "string (required, email format)",
  "contactPhone": "string (optional)",
  "address": "string (optional)",

  // Step 3: Data Types (10 standard + 3 sensitive)
  "dataTypes": ["name", "email", "phone", "address", "payment", "idcard", "dob", "location", "behavior", "ip", "health", "religion", "biometric"],
  // Standard: name (ชื่อ-นามสกุล), email (อีเมล), phone (เบอร์โทรศัพท์), address (ที่อยู่), payment (ข้อมูลการชำระเงิน), idcard (เลขบัตรประชาชน), dob (วันเดือนปีเกิด/อายุ), location (ข้อมูลตำแหน่งที่ตั้ง GPS), behavior (พฤติกรรมการใช้งานเว็บไซต์), ip (IP Address/Device Info)
  // Sensitive: health (ข้อมูลสุขภาพ), religion (ศาสนา/ความเชื่อ), biometric (ข้อมูลชีวมิติ)
  "hasCookies": "ใช่" | "ไม่ใช่",
  "hasUserAccounts": "ใช่" | "ไม่ใช่",

  // Step 4: Purposes & Third Parties
  "purposes": ["service", "order", "contact", "payment", "marketing", "analytics", "legal", "security"],
  // service (ให้บริการหลักแก่ผู้ใช้งาน), order (ดำเนินการคำสั่งซื้อและจัดส่งสินค้า), contact (ติดต่อกลับและตอบคำถามลูกค้า), payment (ดำเนินการชำระเงิน), marketing (ส่งข้อเสนอและข่าวสารการตลาด), analytics (วิเคราะห์และปรับปรุงคุณภาพบริการ), legal (ปฏิบัติตามข้อกำหนดทางกฎหมาย), security (ป้องกันการทุจริตและรักษาความปลอดภัย)
  "thirdParties": ["ga", "gtm", "gads", "fb", "line", "stripe", "omise", "aws", "mailchimp", "zendesk"],
  // ga (Google Analytics), gtm (Google Tag Manager), gads (Google Ads), fb (Facebook Pixel/Meta Ads), line (LINE Official Account), stripe (Stripe), omise (Omise/GB Prime Pay), aws (AWS/Google Cloud), mailchimp (Mailchimp/Klaviyo), zendesk (Zendesk/Freshdesk)

  // Step 5: Settings
  "language": "th" | "en" | "both",
  "exportFormat": ["PDF", "Word (.docx)", "TXT", "HTML Embed"],
  "dpoEmail": "string (optional)",
  "retentionPeriod": "string" // One of: '1 ปี', '2 ปี', '3 ปี', '5 ปี', '7 ปี (ตามกฎหมายภาษี)', '10 ปี', 'ตลอดระยะเวลาการใช้บริการ'
}

Response 200:
{
  "success": true,
  "data": {
    "policyId": "policy_uuid",
    "slug": "mysite-com-privacy",
    "shareUrl": "https://flowpdpa.co.th/p/mysite-com-privacy",
    "name": "Privacy + Cookies Policy",
    "type": "privacy",
    "status": "active",
    "content": {
      "th": "Full Thai policy text...",
      "en": "Full English policy text..."
    },
    "downloads": {
      "pdf": "https://cdn.flowpdpa.co.th/policies/xxx.pdf",
      "docx": "https://cdn.flowpdpa.co.th/policies/xxx.docx",
      "txt": "https://cdn.flowpdpa.co.th/policies/xxx.txt",
      "html": "<script>...</script>"
    },
    "createdAt": "2026-05-23T10:00:00Z"
  }
}

Response 402 (Plan Limit):
{
  "success": false,
  "error": {
    "code": "PREMIUM_FEATURE",
    "message": "ภาษาอังกฤษและฟีเจอร์ขั้นสูงต้องใช้แผน Premium"
  }
}
```

#### 2.2 List User Policies
```http
GET /policies
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "policies": [
      {
        "id": "policy_uuid",
        "name": "Privacy + Cookies Policy",
        "domain": "mysite.com",
        "type": "privacy",
        "language": "TH + EN",
        "status": "active",
        "slug": "mysite-com-privacy",
        "shareUrl": "https://flowpdpa.co.th/p/mysite-com-privacy",
        "downloads": {
          "pdf": "...",
          "docx": "...",
          "txt": "...",
          "html": "..."
        },
        "updatedAt": "2026-05-23T10:00:00Z"
      }
    ],
    "total": 3
  }
}
```

#### 2.3 Get Policy Details
```http
GET /policies/:policyId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "policy": {
      "id": "policy_uuid",
      "name": "Privacy + Cookies Policy",
      "type": "privacy",
      "slug": "mysite-com-privacy",
      "shareUrl": "https://flowpdpa.co.th/p/mysite-com-privacy",
      "status": "active",
      
      // Form data for editing
      "formData": { ... },
      
      // Generated content
      "content": {
        "th": "...",
        "en": "..."
      },
      
      // Metadata
      "createdAt": "2026-05-23T10:00:00Z",
      "updatedAt": "2026-05-23T10:00:00Z",
      "version": 1
    }
  }
}
```

#### 2.4 Update Policy (Re-generate)
```http
PUT /policies/:policyId
Authorization: Bearer <token>
Content-Type: application/json

{
  // Same structure as generate request
  "policyType": "privacy",
  "websiteName": "...",
  ...
}

Response 200:
{
  "success": true,
  "data": {
    "policyId": "policy_uuid",
    "version": 2,
    "slug": "updated-slug",
    ...
  }
}
```

#### 2.5 Delete Policy
```http
DELETE /policies/:policyId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "deleted": true,
    "policyId": "policy_uuid"
  }
}
```

#### 2.6 Get Public Policy (No auth required)
```http
GET /policies/public/:slug

Response 200:
{
  "success": true,
  "data": {
    "policy": {
      "name": "Privacy + Cookies Policy",
      "type": "privacy",
      "content": {
        "th": "...",
        "en": "..."
      },
      "company": {
        "name": "MyShop",
        "url": "https://mysite.com",
        "email": "contact@mysite.com"
      },
      "generatedAt": "2026-05-23T10:00:00Z"
    }
  }
}
```

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
    "profile": {
      "name": "string",
      "function": "string",
      "email": "string",
      "phone": "string",
      "mobile": "string",
      "website": "string",
      "company_name": "string",
      "vat": "string",
      "street": "string",
      "street2": "string",
      "city": "string",
      "state_name": "string",
      "zip": "string",
      "country_name": "string",
      "lang": "th_TH" | "en_US",
      "plan": "Free" | "Premium",
      "createdAt": "2026-05-23T10:00:00Z"
    }
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
  "street": "string",
  "street2": "string",
  "city": "string",
  "state_name": "string",
  "zip": "string",
  "country_name": "string",
  "lang": "th_TH"
}

Response 200:
{
  "success": true,
  "data": {
    "updated": true,
    "profile": { ... }
  }
}
```

#### 3.3 Change Password
```http
POST /profile/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "string",
  "newPassword": "string (min 6 chars)"
}

Response 200:
{
  "success": true,
  "data": {
    "changed": true
  }
}
```

---

### 4. Helpdesk/Ticket APIs

#### 4.1 Submit Ticket
```http
POST /tickets
Authorization: Bearer <token> (Optional)
Content-Type: application/json

{
  "partner_name": "string (required)",
  "partner_email": "string (required)",
  "partner_phone": "string (optional)",
  "partner_company_name": "string (optional)",
  "name": "string (required)", // Subject/ticket title
  "ticket_type_id": "number | null", // Odoo ticket type ID
  "ticket_type_label": "string", // Label shown in UI
  "priority": "normal" | "low" | "high" | "urgent",
  "tag_ids": ["string"], // Category tags (mapped to Odoo tag IDs)
  "description": "string (required)"
}

Response 200:
{
  "success": true,
  "data": {
    "ticketId": "TKT-ABC123",
    "status": "open",
    "createdAt": "2026-05-23T10:00:00Z"
  }
}
```

#### 4.2 Get Ticket Status
```http
GET /tickets/:ticketId

Response 200:
{
  "success": true,
  "data": {
    "ticket": {
      "id": "TKT-ABC123",
      "name": "string",
      "partner_name": "string",
      "partner_email": "string",
      "partner_phone": "string",
      "partner_company_name": "string",
      "ticket_type_id": "number | null",
      "ticket_type_label": "string",
      "priority": "normal",
      "tag_ids": ["string"],
      "description": "string",
      "status": "open" | "in_progress" | "resolved" | "closed",
      "createdAt": "2026-05-23T10:00:00Z"
    }
  }
}
```

#### 4.3 List User Tickets
```http
GET /tickets
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "tickets": [ ... ]
  }
}
```

---

### 5. Admin APIs

#### 5.1 Admin Overview
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
```http
GET /admin/merchants?status=active&search=query
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
```http
PUT /admin/merchants/:merchantId/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "active" | "suspended" | "pending"
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
```http
GET /admin/subscriptions?status=active
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "data": {
    "subscriptions": [ ... ]
  }
}
```

#### 5.6 Update Subscription
```http
PUT /admin/subscriptions/:subscriptionId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "action": "activate" | "suspend" | "cancel"
}

Response 200:
{
  "success": true,
  "data": {
    "updated": true,
    "subscription": { ... }
  }
}
```

#### 5.7 List Payments
```http
GET /admin/payments?status=pending
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
        "gateway": "promptpay",
        "plan": "Pro",
        "status": "pending",
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

#### 5.8 Approve Payment
```http
POST /admin/payments/:paymentId/approve
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "data": {
    "approved": true,
    "payment": { ... }
  }
}
```

#### 5.9 Error Logs
```http
GET /admin/monitoring/logs?level=critical
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

#### 5.10 Analytics
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
│  5. tickets          ──── Helpdesk tickets                              │
│  6. subscriptions    ──── Subscription records                          │
│  7. payments         ──── Payment records                               │
│  8. error_logs       ──── System error logs                             │
│  9. audit_logs       ──── Audit trail                                   │
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
  role VARCHAR(50) NOT NULL DEFAULT 'merchant', -- 'merchant', 'admin'
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'pending'
  
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
CREATE TYPE policy_status AS ENUM ('draft', 'active', 'archived');

CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Policy Info
  name VARCHAR(255) NOT NULL,
  type policy_type NOT NULL DEFAULT 'privacy',
  status policy_status NOT NULL DEFAULT 'active',
  slug VARCHAR(255) UNIQUE NOT NULL,
  
  -- Form Data (JSON)
  form_data JSONB NOT NULL,
  /*
  form_data structure:
  {
    policyType: "privacy",
    agreedToTerms: true,
    websiteName: "...",
    websiteUrl: "...",
    businessType: "...",
    contactEmail: "...",
    contactPhone: "...",
    address: "...",
    dataTypes: ["name", "email", ...],
    hasCookies: "ใช่" | "ไม่ใช่",
    hasUserAccounts: "ใช่" | "ไม่ใช่",
    purposes: ["service", "order", ...],
    thirdParties: ["ga", "fb", ...],
    language: "th" | "en" | "both",
    exportFormat: ["PDF", "Word", ...],
    dpoEmail: "...",
    retentionPeriod: "..."
  }
  */
  
  -- Generated Content
  content_th TEXT,
  content_en TEXT,
  
  -- Share URL
  share_url VARCHAR(500),
  
  -- Downloads (CDN URLs)
  download_url_pdf VARCHAR(500),
  download_url_docx VARCHAR(500),
  download_url_txt VARCHAR(500),
  html_embed_code TEXT,
  
  -- Metadata
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

#### 5. tickets
```sql
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_type AS ENUM ('technical', 'billing', 'feature', 'other', 'legal');
CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE tickets (
  id VARCHAR(50) PRIMARY KEY, -- TKT-XXXXXXXX format
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  
  -- Customer Info (allow guest tickets)
  partner_name VARCHAR(255) NOT NULL,
  partner_email VARCHAR(255) NOT NULL,
  partner_phone VARCHAR(50),
  partner_company VARCHAR(255),
  
  -- Ticket Info
  name VARCHAR(500) NOT NULL,
  type ticket_type NOT NULL DEFAULT 'other',
  priority ticket_priority NOT NULL DEFAULT 'normal',
  status ticket_status NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  
  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tickets_merchant_id ON tickets(merchant_id);
CREATE INDEX idx_tickets_partner_email ON tickets(partner_email);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_type ON tickets(type);
```

#### 6. subscriptions
```sql
CREATE TYPE sub_status AS ENUM ('active', 'suspended', 'cancelled', 'expired');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly', 'onetime');

CREATE TABLE subscriptions (
  id VARCHAR(50) PRIMARY KEY, -- SUB-XXXXXXXX format
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Plan
  plan VARCHAR(50) NOT NULL, -- 'Pro', 'Starter'
  status sub_status NOT NULL DEFAULT 'active',
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Dates
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Quota (for scans)
  quota INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_merchant_id ON subscriptions(merchant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);
```

#### 7. payments
```sql
CREATE TYPE payment_status AS ENUM ('success', 'pending', 'failed', 'refunded');
CREATE TYPE payment_gateway AS ENUM ('promptpay', 'bank_transfer', 'credit_card', 'free');

CREATE TABLE payments (
  id VARCHAR(50) PRIMARY KEY, -- PAY-XXXXXXXX format
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  subscription_id VARCHAR(50) REFERENCES subscriptions(id),
  
  -- Payment Info
  amount DECIMAL(10, 2) NOT NULL,
  gateway payment_gateway NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  
  -- Reference
  gateway_ref VARCHAR(255), -- Bank ref, slip ID, etc.
  slip_image_url VARCHAR(500),
  
  -- Approval
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES merchants(id),
  
  -- Metadata
  plan VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
```

#### 8. error_logs
```sql
CREATE TYPE log_level AS ENUM ('info', 'warning', 'error', 'critical');

CREATE TABLE error_logs (
  id VARCHAR(50) PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  
  level log_level NOT NULL,
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

#### 9. audit_logs
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
│     • Ensures legal compliance (PDPA, GDPR if Premium)                 │
│     • Translates to English if Premium plan                           │
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
6. If Premium plan, include additional GDPR compliance clauses

Return the complete customized policy.
```

### AI Response Expected Format

```typescript
interface AICustomizedPolicy {
  contentTh: string;      // Customized Thai policy
  contentEn?: string;     // English version (if Premium)
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
async function generatePolicy(formData: FormData, userPlan: string): Promise<Policy> {
  
  // 1. Select appropriate template
  const template = await loadTemplate(formData.policyType, 'th');
  
  // 2. Prepare AI request
  const aiRequest: AICustomizationRequest = {
    template: template,
    formData: formData,
    plan: userPlan,
    language: formData.language
  };
  
  // 3. Call AI to customize
  const aiResponse = await callAIService(aiRequest);
  
  // 4. If English requested (Premium only)
  if (formData.language === 'both' || formData.language === 'en') {
    const templateEn = await loadTemplate(formData.policyType, 'en');
    aiResponse.contentEn = await callAIService({
      ...aiRequest,
      template: templateEn
    });
  }
  
  // 5. Generate files
  const files = await generateFiles(aiResponse);
  
  // 6. Save to database
  const policy = await savePolicy({
    ...formData,
    contentTh: aiResponse.contentTh,
    contentEn: aiResponse.contentEn,
    files: files,
    templateId: template.id,
    templateVersion: template.version
  });
  
  return policy;
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
| `PREMIUM_FEATURE` | 402 | Feature requires Premium plan |
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

### File Upload (for payment slips)

```http
POST /admin/payments/slupload
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

file: [binary]

Response 200:
{
  "success": true,
  "data": {
    "url": "https://cdn.flowpdpa.co.th/slips/xxx.jpg",
    "filename": "slip-xxx.jpg"
  }
}
```

---

## Deployment Checklist

- [ ] Set up PostgreSQL database with above schema
- [ ] Configure JWT secret and expiration
- [ ] Set up AI service API key (OpenAI/Anthropic)
- [ ] Configure CDN for policy downloads (PDF, DOCX)
- [ ] Set up email service for notifications (optional)
- [ ] Configure rate limiting
- [ ] Set up logging and monitoring
- [ ] Configure CORS for frontend domain
- [ ] Set up backup strategy
- [ ] Configure SSL/TLS certificates

---

## Notes for Backend Team

1. **Demo User**: Hardcode `demo@flowpdpa.co.th` / `demo1234` → plan="Premium"
2. **Admin User**: Hardcode `admin@flowpdpa.co.th` / `admin2025` → role="admin"
3. **Policy Generation**: Call AI service asynchronously, return job ID if processing takes > 5s
4. **PDF Generation**: Use libraries like `pdfkit` (Node.js) or `reportlab` (Python)
5. **Slug Generation**: Use format `{domain-sanitized}-{policy-type}` e.g. `mysite-com-privacy`
6. **Odoo Integration**: Helpdesk sync is optional, use provided spec if integrating
7. **Thai Language Support**: Ensure all strings support UTF-8

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-23  
**Questions?** Contact: tech@flowpdpa.co.th
