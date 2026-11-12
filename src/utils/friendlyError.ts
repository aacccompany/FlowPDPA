import type { ApiError } from '@/services/api/types'

/**
 * Text for the person at the keyboard. A backend message is shown only when it is already Thai
 * (the API writes those for people); raw technical strings like "Unauthorized" or
 * "Request failed with status 502" are replaced with a plain sentence.
 */
export function friendlyError(error: Partial<ApiError> | undefined, fallback: string): string {
  if (error?.message && /[ก-๙]/.test(error.message)) return error.message
  if (!error?.status || error.status >= 500 || error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
    return 'เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้งในอีกสักครู่'
  }
  return fallback
}
