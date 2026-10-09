import { authApi } from './auth'
import { dashboardApi } from './dashboard'
import { policiesApi } from './policies'
import { profileApi } from './profile'
import { uploadFile } from './upload'
import { legalApi } from './legal'
import { adminApi } from './admin'
import { consentsApi } from './consents'
import { templatesApi } from './templates'
import { billingApi } from './billing'
import { companyDocumentsApi } from './companyDocuments'
import { companyRegistryApi } from './companyRegistry'

export const api = {
  auth: authApi,
  profile: profileApi,
  policies: policiesApi,
  dashboard: dashboardApi,
  upload: uploadFile,
  legal: legalApi,
  admin: adminApi,
  consents: consentsApi,
  templates: templatesApi,
  billing: billingApi,
  companyDocuments: companyDocumentsApi,
  companyRegistry: companyRegistryApi,
}

export { apiRequest } from './client'
export { API_ENDPOINTS } from './endpoints'
export { fileSha256 } from './companyDocuments'
export { useApiLoading } from './useApiLoading'
export type * from './types'
export type * from './policyTypes'
export type * from './adminTypes'
export type * from './consents'
export type * from './templates'
export type * from './billing'
export type * from './companyDocuments'
export type * from './companyRegistry'

export default api
