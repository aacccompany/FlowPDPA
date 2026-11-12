import { apiRequest } from './client'
import { API_ENDPOINTS } from './endpoints'

export const uploadFile = (file: File, type: 'avatar' | 'document' | 'policy') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  return apiRequest(API_ENDPOINTS.upload.root, { method: 'POST', body: formData })
}
