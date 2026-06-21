export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    adminLogin: '/auth/admin-login',
    register: '/auth/register',
    verifyRegistration: '/auth/register/verify',
    resendRegistrationOtp: '/auth/register/resend-otp',
    verifyToken: '/auth/verify',
    refreshToken: '/auth/refresh',
  },
  profile: {
    root: '/profile',
  },
  policies: {
    root: '/policies',
    byId: (policyId: string) => `/policies/${encodeURIComponent(policyId)}`,
    publicBySlug: (slug: string) => `/policies/public/${encodeURIComponent(slug)}`,
  },
  legal: {
    submissions: '/legal/submissions',
    submission: (slug: string) => `/legal/submissions/${encodeURIComponent(slug)}`,
  },
  dashboard: {
    stats: '/dashboard/stats',
    activities: '/dashboard/activities',
  },
  upload: {
    root: '/upload',
  },
} as const
