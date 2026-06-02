# FlowPDPA — Backend Architecture & Flow Diagrams

**For:** Backend Development Team  
**Date:** 2026-05-23

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            FLOWPDPA SYSTEM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐                  │
│  │   FRONTEND   │      │   BACKEND    │      │  DATABASE    │                  │
│  │   (React)    │◄────►│   (Node.js)  │◄────►│ (PostgreSQL) │                  │
│  │              │      │              │      │              │                  │
│  │ Vite + TS    │      │ + JWT Auth   │      │ + Relational │                  │
│  │ + Tailwind   │      │ + AI Module  │      │ + Indexed    │                  │
│  └──────────────┘      └──────────────┘      └──────────────┘                  │
│           │                     │                                                    │
│           │              ┌──────┴──────┐                                          │
│           │              │             │                                          │
│           │         ┌────▼────┐  ┌────▼────┐                                      │
│           │         │   AI    │  │  CDN    │                                      │
│           │         │ SERVICE │  │ Storage │                                      │
│           │         │(OpenAI  │  │ (Files) │                                      │
│           │         │Claude)  │  │         │                                      │
│           │         └─────────┘  └─────────┘                                      │
│           │                                                                          │
│  ┌────────▼────────────────────────────────────────────────────────────────┐     │
│                           EXTERNAL INTEGRATIONS                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │     Odoo     │  │ Payment GW   │  │    LINE      │  │    Email     │    │
│  │ (Helpdesk)   │  │ (PromptPay)  │  │ (Notify)    │  │ (Notices)    │    │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow: Policy Generation (Main Feature)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    STEP-BY-STEP: POLICY GENERATION                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  USER                    FRONTEND                  BACKEND                 AI      │
│    │                        │                         │                     │       │
│    │  1. Fill 6-step form    │                         │                     │       │
│    ├───────────────────────►│                         │                     │       │
│    │                        │  2. Collect form data    │                     │       │
│    │                        │  into FormData object   │                     │       │
│    │                        │                         │                     │       │
│    │  3. Click "สร้างนโยบาย" │                         │                     │       │
│    ├───────────────────────►│                         │                     │       │
│    │                        │  4. Check localStorage  │                     │       │
│    │                        │     for auth token       │                     │       │
│    │                        │                         │                     │       │
│    │                        │  5. No token?           │                     │       │
│    │                        │     Show AuthGate modal │                     │       │
│    │                        │     ┌────────────────┐   │                     │       │
│    │                        │     │ Login/Register │   │                     │       │
│    │                        │     └────────┬───────┘   │                     │       │
│    │                        │              │            │                     │       │
│    │  6. User logs in       │              │            │                     │       │
│    ├───────────────────────►│              │            │                     │       │
│    │                        │  7. Got token!         │                     │       │
│    │                        │                         │                     │       │
│    │                        │  8. POST /policies/generate                    │       │
│    │                        │  {                      │                     │       │
│    │                        │    formData: {...},     │                     │       │
│    │                        │    token: "jwt..."      │                     │       │
│    │                        │  }                     │                     │       │
│    │                        ├────────────────────────►│                     │       │
│    │                        │                         │                     │       │
│    │                        │                         │  9. Verify JWT       │       │
│    │                        │                         │     Extract user_id  │       │
│    │                        │                         │                     │       │
│    │                        │                         │ 10. Check plan       │       │
│    │                        │                         │     Free: Thai only  │       │
│    │                        │                         │     Premium: TH+EN  │       │
│    │                        │                         │                     │       │
│    │                        │                         │ 11. Build AI prompt  │       │
│    │                        │                         │     from formData    │       │
│    │                        │                         │                     │       │
│    │                        │                         │ 12. Call AI service  │       │
│    │                        │                         ├────────────────────►│       │
│    │                        │                         │  Generate PDPA      │       │
│    │                        │                         │  compliant text     │       │
│    │                        │                         │◄────────────────────│       │
│    │                        │                         │                     │       │
│    │                        │                         │ 13. Generate files   │       │
│    │                        │                         │     • PDF            │       │
│    │                        │                         │     • Word (.docx)   │       │
│    │                        │                         │     • TXT            │       │
│    │                        │                         │     • HTML Embed     │       │
│    │                        │                         │                     │       │
│    │                        │                         │ 14. Save to DB       │       │
│    │                        │                         │     INSERT policies  │       │
│    │                        │                         │     INSERT policy_versions│    │
│    │                        │                         │     INSERT audit_logs│       │
│    │                        │                         │                     │       │
│    │                        │                         │ 15. Upload files to  │       │
│    │                        │                         │     CDN              │       │
│    │                        │                         │                     │       │
│    │                        │  16. Response           │                     │       │
│    │                        │     {                   │                     │       │
│    │                        │       policyId,         │                     │       │
│    │                        │       slug,            │                     │       │
│    │                        │       shareUrl,        │                     │       │
│    │                        │       downloads: {...} │                     │       │
│    │                        │     }                   │                     │       │
│    │                        │◄────────────────────────│                     │       │
│    │                        │                         │                     │       │
│    │  17. Show Success      │                         │                     │       │
│    │  Screen with:          │                         │                     │       │
│    │  • Download buttons    │                         │                     │       │
│    │  • Copy URL button     │                         │                     │       │
│    │  • View Dashboard link │                         │                     │       │
│    ◄────────────────────────│                         │                     │       │
│                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow Detail

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW DETAIL                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │                          JWT TOKEN STRUCTURE                             │     │
│  ├─────────────────────────────────────────────────────────────────────────┤     │
│  │  Header:                                                                 │     │
│  │    {                                                                     │     │
│  │      "alg": "HS256",                                                     │     │
│  │      "typ": "JWT"                                                        │     │
│  │    }                                                                     │     │
│  │                                                                          │     │
│  │  Payload:                                                                │     │
│  │    {                                                                     │     │
│  │      "sub": "merchant_uuid",      // User ID                            │     │
│  │      "email": "user@example.com",                                       │     │
│  │      "role": "merchant" | "admin",                                      │     │
│  │      "plan": "Free" | "Premium",                                       │     │
│  │      "iat": 1700000000,            // Issued at                         │     │
│  │      "exp": 1700604800             // Expires (7 days)                  │     │
│  │    }                                                                     │     │
│  │                                                                          │     │
│  │  Signature: HMAC-SHA256(secret_key, header + payload)                   │     │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │                        PASSWORD HASHING                                  │     │
│  ├─────────────────────────────────────────────────────────────────────────┤     │
│  │  Registration:                                                           │     │
│  │    password = "mypassword123"                                            │     │
│  │    salt = bcrypt.genSalt(10)                                             │     │
│  │    password_hash = bcrypt.hash(password, salt)                           │     │
│  │    // Store password_hash in DB                                          │     │
│  │                                                                          │     │
│  │  Login:                                                                  │     │
│  │    input_password = "mypassword123"                                      │     │
│  │    stored_hash = "$2b$10$..."                                           │     │
│  │    valid = bcrypt.compare(input_password, stored_hash)                   │     │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Entity Relationships

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      DATABASE ENTITY RELATIONSHIPS (ERD)                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  ┌──────────────┐                                                                          │
│  │  merchants   │                                                                          │
│  │ ──────────── │                                                                          │
│  │ id (PK)      │───┐                                                                     │
│  │ email        │   │                                                                     │
│  │ password_hash│   │    ┌─────────────────────────────────────────────┐                  │
│  │ name         │   │    │                                             │                  │
│  │ plan         │   │    │   All relationships flow FROM merchants      │                  │
│  │ role         │   │    │                                             │                  │
│  │ status       │   │    │   ┌────────────┐      ┌────────────┐        │                  │
│  └──────────────┘   │    │   │            │      │            │        │                  │
│         │            │    └──►│ policies   │      │ tickets    │        │                  │
│         │            │        │ (1:N)      │      │ (1:N)      │        │                  │
│         │            │        │            │      │            │        │                  │
│         │            │        └─────┬──────┘      └─────┬──────┘        │                  │
│         │            │              │                   │                │                  │
│         │            │              ▼                   ▼                │                  │
│         │            │    ┌─────────────────┐   ┌─────────────────┐     │                  │
│         │            │    │ policy_versions │   │                 │     │                  │
│         │            │    │ (1:N)           │   │ (No direct      │     │                  │
│         │            │    │                 │   │  relationship)  │     │                  │
│         │            │    └─────────────────┘   │                 │     │                  │
│         │            │                          └─────────────────┘     │                  │
│         │            │                                                   │                  │
│         │            │    ┌──────────────┐       ┌──────────────┐       │                  │
│         └────────────┴───►│ subscriptions│       │  payments    │       │                  │
│                            │ (1:1 or 1:N)│       │ (1:N)        │       │                  │
│                            │              │       │              │       │                  │
│                            └──────┬───────┘       └──────┬───────┘       │                  │
│                                   │                      │                │                  │
│                            ┌──────▼───────┐       ┌──────▼───────┐       │                  │
│                            │              │       │              │       │                  │
│                            │ payments has │       │ subscriptions│       │                  │
│                            │ foreign key  │       │ has foreign  │       │                  │
│                            │ to subs      │       │ key to pay   │       │                  │
│                            └──────────────┘       └──────────────┘       │                  │
│                                                                                 │                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │                  │
│  │                     merchant_profiles (1:1 with merchants)             │   │                  │
│  │ ─────────────────────────────────────────────────────────────────────  │   │                  │
│  │ id (PK)                                                                   │   │                  │
│  │ merchant_id (FK → merchants.id, UNIQUE)                                  │   │                  │
│  │ phone, mobile, website                                                    │   │                  │
│  │ company_name, tax_id                                                      │   │                  │
│  │ address fields (street, city, state, zip, country)                        │   │                  │
│  │ language, line_connected                                                  │   │                  │
│  └─────────────────────────────────────────────────────────────────────────┘   │                  │
│                                                                                 │                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │                  │
│  │                     audit_logs (tracks all actions)                     │   │                  │
│  │ ─────────────────────────────────────────────────────────────────────  │   │                  │
│  │ id (PK)                                                                   │   │                  │
│  │ merchant_id (FK → merchants.id) NULLABLE                                 │   │                  │
│  │ admin_id (FK → merchants.id) NULLABLE                                    │   │                  │
│  │ action, resource_type, resource_id                                       │   │                  │
│  │ ip_address, user_agent, changes (JSONB)                                  │   │                  │
│  └─────────────────────────────────────────────────────────────────────────┘   │                  │
│                                                                                 │                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │                  │
│  │                     error_logs (system errors)                         │   │                  │
│  │ ─────────────────────────────────────────────────────────────────────  │   │                  │
│  │ id (PK)                                                                   │   │                  │
│  │ merchant_id (FK → merchants.id) NULLABLE                                 │   │                  │
│  │ level, service, message, context (JSONB), stack_trace                    │   │                  │
│  └─────────────────────────────────────────────────────────────────────────┘   │                  │
│                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Summary

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          API ENDPOINT SUMMARY                                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  PUBLIC (No Auth)                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  POST   /auth/register              Register new user                            │
│  POST   /auth/login                 User login                                  │
│  POST   /auth/admin-login           Admin login                                 │
│  GET    /policies/public/:slug      Get public policy page                      │
│  GET    /tickets/:ticketId          Get ticket status (by ID)                   │
│                                                                                    │
│  PROTECTED (User Auth Required)                                                   │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  GET    /auth/verify                Verify JWT token                             │
│                                                                                    │
│  GET    /profile                     Get user profile                            │
│  PUT    /profile                     Update user profile                         │
│  POST   /profile/change-password     Change password                             │
│                                                                                    │
│  POST   /policies/generate           Generate new policy (AI)                    │
│  GET    /policies                    List user policies                          │
│  GET    /policies/:id                Get policy details                          │
│  PUT    /policies/:id                Update policy (re-generate)                 │
│  DELETE /policies/:id                Delete policy                               │
│                                                                                    │
│  POST   /tickets                     Submit ticket                                │
│  GET    /tickets                     List user tickets                           │
│                                                                                    │
│  ADMIN (Admin Auth Required)                                                  │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  GET    /admin/overview              Admin dashboard KPIs                        │
│  GET    /admin/merchants             List all merchants                          │
│  GET    /admin/merchants/:id         Get merchant details                        │
│  PUT    /admin/merchants/:id/status  Update merchant status                      │
│                                                                                    │
│  GET    /admin/subscriptions         List all subscriptions                      │
│  PUT    /admin/subscriptions/:id     Update subscription                         │
│                                                                                    │
│  GET    /admin/payments              List all payments                           │
│  POST   /admin/payments/:id/approve  Approve payment                             │
│                                                                                    │
│  GET    /admin/monitoring/logs       Get error logs                              │
│  GET    /admin/analytics             Get analytics data                          │
│                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## AI Prompt Engineering (Template Customization)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    AI PROMPT ENGINEERING (TEMPLATE-BASED)                        │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  The AI's role is NOT to generate from scratch, but to customize your            │
│  lawyer-approved templates based on client data.                                 │
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │                     PROMPT STRUCTURE                                     │     │
│  ├─────────────────────────────────────────────────────────────────────────┤     │
│  │                                                                          │     │
│  │  1. SYSTEM ROLE                                                          │     │
│  │     "You are a legal document assistant. Your task is to customize       │     │
│  │      a legal template based on client information."                      │     │
│  │                                                                          │     │
│  │  2. THE BASE TEMPLATE                                                    │     │
│  │     [Insert complete lawyer-approved template with placeholders]          │     │
│  │                                                                          │     │
│  │  3. CLIENT INFORMATION (Form Data)                                       │     │
│  │     • Company name, website URL, business type                           │     │
│  │     • Contact information, address                                       │     │
│  │     • Data types collected                                               │     │
│  │     • Purposes, third parties, cookies, user accounts                    │     │
│  │     • DPO email, retention period                                        │     │
│  │                                                                          │     │
│  │  4. INSTRUCTIONS (CRITICAL)                                               │     │
│  │     "DO NOT change legal wording. Only:"                                 │     │
│  │     • Replace {{placeholders}} with actual data                          │     │
│  │     • Include sections that apply based on client data                  │     │
│  │     • Remove sections marked 'include if' that don't apply              │     │
│  │     • Keep all legal text EXACTLY as written"                           │     │
│  │                                                                          │     │
│  │  5. OUTPUT EXPECTATION                                                   │     │
│  │     "Return the complete customized policy ready to use."                │     │
│  │                                                                          │     │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │                     EXAMPLE PROMPT (Template Customization)              │     │
│  ├─────────────────────────────────────────────────────────────────────────┤     │
│  │                                                                          │     │
│  │  BASE TEMPLATE:                                                          │     │
│  │  [Complete legal template with {{placeholders}}]                         │     │
│  │                                                                          │     │
│  │  CLIENT INFORMATION:                                                      │     │
│  │  - Company: MyShop Co., Ltd.                                             │     │
│  │  - Website: https://myshop.com                                           │     │
│  │  - Business: E-commerce                                                  │     │
│  │  - Email: contact@myshop.com                                            │     │
│  │                                                                          │     │
│  │  DATA COLLECTED: name, email, phone, address, payment                    │     │
│  │  HAS COOKIES: Yes                                                         │     │
│  │  HAS USER ACCOUNTS: Yes                                                   │     │
│  │  PURPOSES: service, order, payment, marketing                            │     │
│  │  THIRD PARTIES: Google Analytics, Facebook Pixel, PromptPay              │     │
│  │  DPO EMAIL: dpo@myshop.com                                               │     │
│  │  RETENTION: 2 years                                                      │     │
│  │                                                                          │     │
│  │  INSTRUCTIONS:                                                            │     │
│  │  1. Replace all {{placeholders}} with actual client data                 │     │
│  │  2. Include Cookie Policy section (hasCookies = true)                    │     │
│  │  3. Include User Accounts section (hasUserAccounts = true)              │     │
│  │  4. Include Third Party Sharing (thirdParties not empty)                │     │
│  │  5. DO NOT modify any legal wording                                     │     │
│  │  6. Return complete customized policy                                    │     │
│  │                                                                          │     │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Key Difference: Template-Based vs Generation

| Aspect | AI Generation (Old) | Template Customization (New) |
|--------|---------------------|----------------------------|
| Legal Base | AI creates from scratch | Your pre-approved templates |
| Consistency | May vary each time | Always consistent |
| Legal Risk | Higher (AI may miss things) | Lower (lawyer-approved) |
| Control | Less control | Full control over content |
| AI Role | Creates legal text | Fills templates intelligently |
│ Fallback | Hard if AI fails | Simple string replacement |

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT ARCHITECTURE                                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│                              ┌─────────────────────┐                             │
│                              │    Load Balancer    │                             │
│                              │   (nginx/AWS ALB)   │                             │
│                              └──────────┬──────────┘                             │
│                                         │                                        │
│                    ┌────────────────────┴────────────────────┐                   │
│                    │                                         │                   │
│           ┌────────▼────────┐                     ┌────────▼────────┐               │
│           │   Frontend CDN   │                     │   Backend API    │               │
│           │   (Vercel/Netlify│                     │   (Node.js)       │               │
│           │   or S3+CF)      │                     │   + PM2/Docker    │               │
│           └─────────────────┘                     └────────┬────────┘               │
│                                                             │                        │
│                                    ┌────────────────────────┼────────────────┐     │
│                                    │                        │                │     │
│                           ┌────────▼────────┐    ┌────────▼────────┐  ┌───▼────┐  │
│                           │  PostgreSQL RDS  │    │   Redis Cache   │  │  OpenAI│  │
│                           │  (Multi-AZ)      │    │   (Sessions)    │  │  API   │  │
│                           └──────────────────┘    └─────────────────┘  └────────┘  │
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │                        Environment Variables                           │     │
│  ├─────────────────────────────────────────────────────────────────────────┤     │
│  │  # Database                                                               │     │
│  │  DATABASE_URL=postgresql://user:pass@host:5432/flowpdpa                  │     │
│  │                                                                          │     │
│  │  # JWT                                                                   │     │
│  │  JWT_SECRET=your-super-secret-key                                        │     │
│  │  JWT_EXPIRY=604800 (7 days)                                              │     │
│  │                                                                          │     │
│  │  # AI Service                                                            │     │
│  │  OPENAI_API_KEY=sk-...                                                   │     │
│  │  AI_MODEL=gpt-4-turbo                                                    │     │
│  │                                                                          │     │
│  │  # CDN                                                                   │     │
│  │  CDN_URL=https://cdn.flowpdpa.co.th                                     │     │
│  │  AWS_ACCESS_KEY_ID=...                                                   │     │
│  │  AWS_SECRET_ACCESS_KEY=...                                               │     │
│  │                                                                          │     │
│  │  # Email (Optional)                                                      │     │
│  │  SMTP_HOST=smtp.gmail.com                                                │     │
│  │  SMTP_USER=notifications@flowpdpa.co.th                                  │     │
│  │  SMTP_PASS=...                                                           │     │
│  │                                                                          │     │
│  └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Implementation Notes

1. **Demo User Hardcode**
   - Email: `demo@flowpdpa.co.th`
   - Password: `demo1234` (check with bcrypt hash comparison)
   - Plan: `Premium`
   - This user gets all features enabled

2. **Admin User Hardcode**
   - Email: `admin@flowpdpa.co.th`
   - Password: `admin2025`
   - Role: `admin`

3. **Slug Generation**
   - Format: `{domain-sanitized}-{policy-type}`
   - Example: `mysite-com-privacy`, `shop-th-privacy`
   - Must be URL-safe and unique

4. **File Generation**
   - PDF: Use `pdfkit` (Node.js) or `puppeteer`
   - Word: Use `docx` library
   - HTML: Generate embed code with `<iframe>`

5. **AI Fallback**
   - If AI service fails, use template-based generation
   - Store templates for each policy type
   - Always have fallback to ensure service availability

6. **Rate Limiting**
   - Policy generation: 10 per hour per user
   - Login attempts: 5 per 15 minutes per IP
   - API general: 100 requests per minute per user

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-23  
**Related:** [API Specification](api-spec-database-schema.md)
