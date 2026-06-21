import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, ChevronDown, ChevronUp, ShieldCheck, BarChart2 } from 'lucide-react'
import { hasConsented, recordConsent } from '@/api/cookie-consent'

export default function CookieBanner() {
  const [visible,  setVisible]  = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    if (!hasConsented()) setVisible(true)
  }, [])

  async function handle(choice: 'all' | 'essential') {
    setSaving(true)
    await recordConsent(choice)
    setSaving(false)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ backgroundColor: '#ffffff', borderTop: '1px solid #dce1e8', boxShadow: '0 -6px 20px rgba(23,32,51,0.06)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* Main row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">

          {/* Text */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Cookie className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--green)' }} />
            <div>
              <p className="text-sm text-gray-900 font-semibold mb-0.5">เว็บไซต์นี้ใช้คุกกี้</p>
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                เราใช้คุกกี้เพื่อพัฒนาประสบการณ์และวิเคราะห์การใช้งาน อ่าน{' '}
                <Link
                  to="/privacy-policy"
                  className="underline transition-colors"
                  style={{ color: '#667085' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--green)')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                >
                  นโยบายความเป็นส่วนตัว
                </Link>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto sm:shrink-0">
            <button
              onClick={() => setExpanded(v => !v)}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1 text-xs font-medium transition-colors"
              style={{ color: '#667085' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#172033')}
              onMouseLeave={e => (e.currentTarget.style.color = '#667085')}
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              รายละเอียด
            </button>

            <button
              onClick={() => handle('essential')}
              disabled={saving}
              className="w-full text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{
                border: '1px solid #dce1e8',
                color: '#374151',
                backgroundColor: '#ffffff',
                opacity: saving ? 0.6 : 1,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#9ca3af'
                e.currentTarget.style.color = '#172033'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#dce1e8'
                e.currentTarget.style.color = '#374151'
              }}
            >
              เฉพาะที่จำเป็น
            </button>

            <button
              onClick={() => handle('all')}
              disabled={saving}
              className="btn-green w-full text-xs px-5 py-2"
              style={{ borderRadius: '8px', opacity: saving ? 0.6 : 1 }}
            >
              ยอมรับทั้งหมด
            </button>
          </div>
        </div>

        {/* Expandable details */}
        {expanded && (
          <div
            className="mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
            style={{ borderTop: '1px solid #dce1e8' }}
          >
            <div
              className="rounded-xl p-4 flex gap-3"
              style={{ backgroundColor: '#f8fafc', border: '1px solid #dce1e8' }}
            >
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--green)' }} />
              <div>
                <p className="text-xs font-bold text-gray-900 mb-1">คุกกี้ที่จำเป็น</p>
                <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                  ใช้สำหรับการเข้าสู่ระบบ ความปลอดภัย และการตั้งค่าพื้นฐาน ไม่สามารถปิดได้
                </p>
                <span
                  className="inline-block mt-2 text-xs px-2 py-0.5 rounded font-semibold"
                  style={{ backgroundColor: 'rgba(5,150,105,0.15)', color: 'var(--green)' }}
                >
                  เปิดอยู่เสมอ
                </span>
              </div>
            </div>

            <div
              className="rounded-xl p-4 flex gap-3"
              style={{ backgroundColor: '#f8fafc', border: '1px solid #dce1e8' }}
            >
              <BarChart2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#94a3b8' }} />
              <div>
                <p className="text-xs font-bold text-gray-900 mb-1">คุกกี้วิเคราะห์</p>
                <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                  ช่วยให้เราเข้าใจการใช้งานและปรับปรุงบริการ ข้อมูลจะถูกรวบรวมในรูปแบบนิรนาม
                </p>
                <span
                  className="inline-block mt-2 text-xs px-2 py-0.5 rounded font-semibold"
                  style={{ backgroundColor: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}
                >
                  ต้องการความยินยอม
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
