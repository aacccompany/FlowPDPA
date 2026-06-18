// ──────────────────────────────────────────────────────────────
// Google Docs Integration — Frontend Utility
//
// BACKEND DEVELOPER SETUP GUIDE:
// ──────────────────────────────────────────────────────────────
// 1. Go to console.cloud.google.com → Create/select a project
// 2. Enable APIs: "Google Drive API" + "Google Docs API"
// 3. Create OAuth 2.0 credentials:
//    - Type: Web application
//    - Authorized origins: http://localhost:5173, https://yourdomain.com
//    - Authorized redirect URIs: http://localhost:5173
// 4. Add to your .env file:
//    VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
//    VITE_GOOGLE_API_KEY=your_api_key
//
// 5. Backend endpoints to implement (for production):
//    POST   /api/google/auth          → Exchange OAuth code for access token
//    POST   /api/google/docs          → Create a new Google Doc from HTML content
//    GET    /api/google/docs/:id      → Fetch doc title + metadata by Doc ID
//    PATCH  /api/google/docs/:id      → Update doc content
//    DELETE /api/google/docs/:id      → Delete doc from Drive
//
// NOTE: For the internal demo, linking works by pasting a Google Docs URL.
// The OAuth + API creation flow is marked with // [NEEDS BACKEND] below.
// ──────────────────────────────────────────────────────────────

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
export const GOOGLE_API_KEY   = import.meta.env.VITE_GOOGLE_API_KEY   || ''

// OAuth scope needed: read + write Docs and Drive files
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
].join(' ')

export interface GoogleDocInfo {
  id:           string
  title:        string
  url:          string
  lastModified?: string
}

// ── URL / ID Helpers ──────────────────────────────────────────

/**
 * Extract the document ID from a Google Docs URL or return as-is if already an ID.
 * Accepts:
 *   - https://docs.google.com/document/d/DOC_ID/edit
 *   - https://docs.google.com/document/d/DOC_ID/preview
 *   - DOC_ID (raw ID string)
 */
export function extractDocId(input: string): string | null {
  const trimmed = input.trim()
  const urlMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
  if (urlMatch) return urlMatch[1]
  if (/^[a-zA-Z0-9_-]{25,60}$/.test(trimmed)) return trimmed
  return null
}

/** Build the Google Docs editor URL from a doc ID */
export function getDocEditorUrl(docId: string): string {
  return `https://docs.google.com/document/d/${docId}/edit`
}

/** Short display label for a doc (for UI, not the full URL) */
export function getDocShortLabel(docId: string): string {
  return `docs.google.com/…/${docId.slice(0, 10)}…`
}

/**
 * Build the Google Docs preview (embed) URL — read-only, no toolbar.
 * Requires the doc to be shared as "Anyone with the link can view".
 */
export function getDocPreviewUrl(docId: string): string {
  return `https://docs.google.com/document/d/${docId}/preview`
}

// ── [NEEDS BACKEND] OAuth Flow ────────────────────────────────
// Use this when you want the app to create Google Docs automatically
// when a policy is generated (instead of manual URL linking).
//
// Frontend call (Google Identity Services):
//
//   import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from '@/utils/googleDocs'
//
//   const client = google.accounts.oauth2.initTokenClient({
//     client_id: GOOGLE_CLIENT_ID,
//     scope: GOOGLE_SCOPES,
//     callback: (response) => {
//       const token = response.access_token
//       // Send token to backend: POST /api/google/auth { token }
//     },
//   })
//   client.requestAccessToken()
//
// Load the script: <script src="https://accounts.google.com/gsi/client"></script>

// ── [NEEDS BACKEND] Create Doc from HTML ─────────────────────
// Call this when a policy is first generated to auto-create a Google Doc.
//
//   Backend: POST /api/google/docs
//   Body:    { title: string, htmlContent: string }
//   Returns: { id: string, url: string }
//
// Raw Google Docs API (for reference):
//   Step 1 — Create empty doc:
//     POST https://docs.googleapis.com/v1/documents
//     Body: { "title": "Policy: MyShop" }
//
//   Step 2 — Insert content:
//     POST https://docs.googleapis.com/v1/documents/{docId}:batchUpdate
//     Body: { "requests": [{ "insertText": { "location": { "index": 1 }, "text": "..." } }] }

// ── [NEEDS BACKEND] Fetch Doc Info ───────────────────────────
// Use this to verify a doc exists and get its title after linking.
//
//   Backend: GET /api/google/docs/:docId
//   Returns: { id, title, url, lastModified }
//
// Raw Google Drive API (for reference):
//   GET https://www.googleapis.com/drive/v3/files/{docId}?fields=id,name,modifiedTime,webViewLink
//   Authorization: Bearer {accessToken}
