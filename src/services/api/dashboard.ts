import { apiRequest } from './client'
import { API_ENDPOINTS } from './endpoints'

export const dashboardApi = {
  getStats: () => apiRequest(API_ENDPOINTS.dashboard.stats),
  getRecentActivities: () => apiRequest(API_ENDPOINTS.dashboard.activities),
}
