export type ConsentChoice = 'all' | 'essential'

interface ConsentRecord {
  choice: ConsentChoice
  timestamp: string
}

const CONSENT_KEY = 'flowpdpa-cookie-consent'

export const getConsent = (): ConsentRecord | null => {
  try {
    const value = localStorage.getItem(CONSENT_KEY)
    return value ? JSON.parse(value) as ConsentRecord : null
  } catch {
    return null
  }
}

export const hasConsented = () => getConsent() !== null
export const analyticsAllowed = () => getConsent()?.choice === 'all'

export const recordConsent = async (choice: ConsentChoice): Promise<void> => {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({
    choice,
    timestamp: new Date().toISOString(),
  } satisfies ConsentRecord))
}
