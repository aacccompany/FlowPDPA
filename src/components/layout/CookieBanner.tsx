import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie } from 'lucide-react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('flowpdpa-cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => { localStorage.setItem('flowpdpa-cookie-consent', 'accepted'); setVisible(false) }
  const decline = () => { localStorage.setItem('flowpdpa-cookie-consent', 'declined'); setVisible(false) }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Cookie className="w-5 h-5 text-gray-400 shrink-0" />
          <p className="text-sm text-gray-600">
            เราใช้คุกกี้เพื่อพัฒนาประสบการณ์การใช้งานและวิเคราะห์การเข้าชมเว็บไซต์{' '}
            <Link to="/privacy-policy" className="underline font-medium" style={{ color: 'var(--green)' }}>
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="text-sm text-gray-500 px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            ปฏิเสธ
          </button>
          <button
            onClick={accept}
            className="btn-green text-sm px-5 py-2"
            style={{ borderRadius: '6px', padding: '8px 20px' }}
          >
            ยอมรับทั้งหมด
          </button>
        </div>
      </div>
    </div>
  )
}
