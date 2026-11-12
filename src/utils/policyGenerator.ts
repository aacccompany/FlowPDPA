export const generatePolicyHTML = (formData: unknown): string => {
  const data = formData && typeof formData === 'object'
    ? formData as Record<string, unknown>
    : {}
  const websiteName = typeof data.websiteName === 'string' ? data.websiteName : 'เว็บไซต์ของคุณ'
  const contactEmail = typeof data.contactEmail === 'string' ? data.contactEmail : ''

  return `<article><h1>นโยบายความเป็นส่วนตัว</h1><p>${websiteName}</p><p>เอกสารฉบับรอตรวจสอบโดยฝ่ายกฎหมาย</p><p>${contactEmail}</p></article>`
}
