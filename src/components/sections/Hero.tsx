import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section style={{ backgroundColor: 'var(--navy)', paddingTop: '68px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--green)' }}>
              PDPA Compliance Platform
            </p>

            <h1 className="font-black leading-tight mb-6 text-white"
              style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', letterSpacing: '-0.02em' }}>
              สร้าง Privacy Policy<br />
              <span style={{ color: 'var(--green)' }}>ง่ายๆ อย่างมืออาชีพ</span><br />
              ถูกต้องตาม PDPA
            </h1>

            <p className="text-base mb-10 leading-relaxed" style={{ color: '#94a3b8', maxWidth: '480px' }}>
              FlowPDPA รับทำ Privacy Policy ให้คุณในไม่กี่นาที ใช้งานได้จริง หายห่วงเรื่องกฎหมาย โดยไม่ต้องพึ่งนักกฎหมาย
            </p>

            <div className="flex flex-wrap gap-3 mb-14">
              <Link to="/get-started" className="btn-green" style={{ fontSize: '15px', padding: '12px 32px' }}>
                สร้าง Policy ฟรี
              </Link>
              <a href="#check-website"
                className="inline-flex items-center font-semibold px-8 py-3 transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#ffffff', fontSize: '15px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                ตรวจสอบเว็บไซต์ฟรี
              </a>
            </div>

            <div className="grid grid-cols-3 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { v: '3,500+', l: 'นโยบายที่สร้างแล้ว' },
                { v: 'ISO 29110', l: 'ได้รับการรับรอง' },
                { v: '< 5 นาที', l: 'เวลาในการสร้าง' },
              ].map(({ v, l }, i) => (
                <div key={l} className="pr-6" style={i > 0 ? { paddingLeft: '24px', borderLeft: '1px solid rgba(255,255,255,0.08)' } : {}}>
                  <div className="text-xl font-black mb-0.5" style={{ color: 'var(--green)' }}>{v}</div>
                  <div className="text-xs" style={{ color: '#64748b' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div className="hidden lg:block">
            <div style={{
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
              backgroundColor: '#ffffff',
              overflow: 'hidden',
            }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#fc8181' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f6e05e' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#68d391' }} />
                <div className="flex-1 mx-3 text-xs px-3 py-1 text-center"
                  style={{ backgroundColor: '#ffffff', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                  flowpdpa.co.th/dashboard
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <div className="font-bold text-sm" style={{ color: '#111827' }}>นโยบายของฉัน</div>
                    <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>3 เอกสาร · ใช้งานอยู่</div>
                  </div>
                  <button className="text-xs font-bold text-white px-3 py-1.5"
                    style={{ backgroundColor: 'var(--green)', borderRadius: '5px' }}>
                    + สร้างใหม่
                  </button>
                </div>

                <div className="space-y-1 mb-4">
                  {[
                    { name: 'Privacy Policy', domain: 'myshop.co.th', status: 'Active' },
                    { name: 'Cookies Policy', domain: 'myshop.co.th', status: 'Active' },
                    { name: 'HR Privacy Policy', domain: 'myshop.co.th', status: 'Draft' },
                  ].map(({ name, domain, status }) => (
                    <div key={name} className="flex items-center justify-between px-3 py-2.5"
                      style={{ backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#111827' }}>{name}</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>{domain}</div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5"
                        style={{
                          borderRadius: '4px',
                          backgroundColor: status === 'Active' ? '#dcfce7' : '#f3f4f6',
                          color: status === 'Active' ? '#16a34a' : '#9ca3af',
                        }}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3" style={{ backgroundColor: '#f0faf5', borderRadius: '8px', border: '1px solid #c8ded6' }}>
                    <div className="text-xs mb-1" style={{ color: '#6b7280' }}>สถานะ PDPA</div>
                    <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--green)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Compliant
                    </div>
                  </div>
                  <div className="p-3" style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div className="text-xs mb-1" style={{ color: '#6b7280' }}>อัปเดตล่าสุด</div>
                    <div className="text-sm font-bold" style={{ color: '#111827' }}>พ.ค. 2025</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
