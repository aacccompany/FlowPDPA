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
    <footer style={{ backgroundColor: '#062e20' }}>

      {/* CTA strip */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4ade80', letterSpacing: '0.12em' }}>
                เริ่มต้นวันนี้
              </p>
              <h3 className="text-2xl font-black text-white mb-1.5" style={{ lineHeight: 1.25 }}>
                พร้อมปกป้องธุรกิจของคุณแล้วหรือยัง?
              </h3>
              <p className="text-sm" style={{ color: '#6ee7b7' }}>
                สร้าง Privacy Policy ที่ถูกต้องตาม PDPA ได้ในไม่กี่นาที ไม่ต้องพึ่งนักกฎหมาย
              </p>
            </div>
            <Link
              to="/get-started"
              className="shrink-0 inline-flex items-center text-sm font-bold px-7 py-3 transition-all"
              style={{ backgroundColor: '#ffffff', color: '#062e20', borderRadius: '6px' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              เริ่มต้นฟรีวันนี้
            </Link>
          </div>
        </div>
      </div>

      {/* Main columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <img src="/favicon.svg" alt="FlowPDPA" className="w-8 h-8" style={{ filter: 'brightness(0) invert(1)' }} />
              <span className="font-bold text-base tracking-tight text-white">
                Flow<span style={{ color: '#4ade80' }}>PDPA</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#6ee7b7', opacity: 0.7 }}>
              แพลตฟอร์มสร้างนโยบาย PDPA สำหรับธุรกิจไทย ถูกต้อง รวดเร็ว และเข้าถึงได้ทุกธุรกิจ
            </p>
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#86efac', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
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
                  className="w-8 h-8 flex items-center justify-center transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#6ee7b7', borderRadius: '6px' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#ffffff' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#6ee7b7' }}
                >
                  {icon}
                </a>
              ))}
              <a
                href="https://lin.ee/flowpdpa"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-3 flex items-center justify-center text-xs font-bold transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#6ee7b7', borderRadius: '6px' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#ffffff' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#6ee7b7' }}
              >
                LINE
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#4ade80' }}>
              เมนู
            </p>
            <ul className="space-y-3.5">
              {navLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm transition-colors"
                    style={{ color: '#94a3b8' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#4ade80' }}>
              ช่วยเหลือ
            </p>
            <ul className="space-y-3.5">
              {legalLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm transition-colors"
                    style={{ color: '#94a3b8' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#4ade80' }}>
              ติดต่อเรา
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#4ade80' }} />
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                  99/9 อาคารขอนแก่น บิซิเนส เซ็นเตอร์ ชั้น 5<br />
                  ถนนศรีจันทร์ ต.ในเมือง อ.เมืองขอนแก่น<br />
                  จ.ขอนแก่น 40000
                </p>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 shrink-0" style={{ color: '#4ade80' }} />
                <span className="text-sm font-semibold text-white">043-123-456</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 shrink-0" style={{ color: '#4ade80' }} />
                <a
                  href="mailto:contact@flowpdpa.co.th"
                  className="text-sm transition-colors"
                  style={{ color: '#94a3b8' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
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
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: '#475569' }}
        >
          <p>©2025 บริษัท ฟลว์พีดีพีเอ จำกัด · All Rights Reserved.</p>
          <div className="flex gap-5">
            <Link
              to="/terms"
              className="transition-colors"
              style={{ color: '#475569' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >
              เงื่อนไขการใช้งาน
            </Link>
            <Link
              to="/privacy-policy"
              className="transition-colors"
              style={{ color: '#475569' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >
              นโยบายความเป็นส่วนตัว
            </Link>
          </div>
        </div>
      </div>

    </footer>
  )
}
