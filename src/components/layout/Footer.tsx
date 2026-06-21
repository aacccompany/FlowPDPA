import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'

const navLinks = [
  { label: 'หน้าแรก', to: '/' },
  { label: 'ทำไมต้อง FlowPDPA', to: '/#why' },
  { label: 'เกี่ยวกับเรา', to: '/about' },
  { label: 'โปรแกรมพาร์ทเนอร์', to: '/#contact' },
]

const legalLinks = [
  { label: 'นโยบายความเป็นส่วนตัว', to: '/privacy-policy' },
  { label: 'เงื่อนไขการใช้งาน', to: '/terms' },
  { label: 'คำถามที่พบบ่อย', to: '/faq' },
  { label: 'ติดต่อฝ่ายสนับสนุน', to: '/support' },
  { label: 'Helpdesk', to: '/helpdesk' },
]

export default function Footer() {
  return (
    <footer className="public-light-footer" style={{ backgroundColor: 'var(--navy)' }}>

      {/* Brand accent */}
      <div style={{ height: '2px', backgroundColor: 'var(--green)' }} />

      {/* CTA strip */}
      <div style={{ backgroundColor: 'var(--navy-light)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black text-white mb-1">พร้อมปกป้องธุรกิจของคุณแล้วหรือยัง?</h3>
            <p className="text-sm" style={{ color: '#64748b' }}>
              สร้าง Privacy Policy ที่ถูกต้องตาม PDPA ได้ในไม่กี่นาที ไม่ต้องพึ่งนักกฎหมาย
            </p>
          </div>
          <Link
            to="/get-started"
            className="btn-green px-8 py-3 text-sm shrink-0"
          >
            เริ่มต้นฟรีวันนี้
          </Link>
        </div>
      </div>

      {/* Main columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-0.5 mb-4">
              <span className="font-black text-xl text-white tracking-tight">Flow</span>
              <span className="font-black text-xl tracking-tight" style={{ color: 'var(--green)' }}>PDPA</span>
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#475569' }}>
              แพลตฟอร์มสร้างนโยบาย PDPA สำหรับธุรกิจไทย ถูกต้อง รวดเร็ว และเข้าถึงได้ทุกธุรกิจ
            </p>
            <div
              className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-5"
              style={{ backgroundColor: 'rgba(5,150,105,0.12)', color: 'var(--green)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              ISO 29110 Certified
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2">
              {[
                {
                  label: 'Facebook',
                  href: 'https://facebook.com/flowpdpa',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  ),
                },
              ].map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#475569' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                >
                  {icon}
                </a>
              ))}
              <a
                href="https://lin.ee/flowpdpa"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-3 flex items-center justify-center rounded-lg text-xs font-bold transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#475569' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
              >
                LINE
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.15em] mb-5 flex items-center gap-2"
              style={{ color: 'var(--green)' }}
            >
              <span className="block w-4 h-px" style={{ backgroundColor: 'var(--green)', opacity: 0.5 }} />
              เมนู
            </p>
            <ul className="space-y-3">
              {navLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm transition-colors"
                    style={{ color: '#475569' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.15em] mb-5 flex items-center gap-2"
              style={{ color: 'var(--green)' }}
            >
              <span className="block w-4 h-px" style={{ backgroundColor: 'var(--green)', opacity: 0.5 }} />
              ช่วยเหลือ
            </p>
            <ul className="space-y-3">
              {legalLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm transition-colors"
                    style={{ color: '#475569' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.15em] mb-5 flex items-center gap-2"
              style={{ color: 'var(--green)' }}
            >
              <span className="block w-4 h-px" style={{ backgroundColor: 'var(--green)', opacity: 0.5 }} />
              ติดต่อเรา
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#334155' }} />
                <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                  99/9 อาคารขอนแก่น บิซิเนส เซ็นเตอร์ ชั้น 5<br />
                  ถนนศรีจันทร์ ต.ในเมือง อ.เมืองขอนแก่น<br />
                  จ.ขอนแก่น 40000
                </p>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 shrink-0" style={{ color: '#334155' }} />
                <span className="text-sm font-semibold text-white">043-123-456</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 shrink-0" style={{ color: '#334155' }} />
                <a
                  href="mailto:contact@flowpdpa.co.th"
                  className="text-sm transition-colors"
                  style={{ color: '#475569' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                >
                  contact@flowpdpa.co.th
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-8 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#334155' }}
        >
          <p>©2025 บริษัท ฟลว์พีดีพีเอ จำกัด · All Rights Reserved.</p>
          <div className="flex gap-5">
            <Link
              to="/terms"
              className="transition-colors"
              style={{ color: '#334155' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
              onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
            >
              เงื่อนไขการใช้งาน
            </Link>
            <Link
              to="/privacy-policy"
              className="transition-colors"
              style={{ color: '#334155' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
              onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
            >
              นโยบายความเป็นส่วนตัว
            </Link>
          </div>
        </div>
      </div>

    </footer>
  )
}
