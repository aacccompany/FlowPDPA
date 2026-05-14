import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section style={{ backgroundColor: 'var(--navy)', paddingTop: '61px', minHeight: '92vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Left */}
          <div className="lg:col-span-6">
            <div className="w-12 h-1 mb-8" style={{ backgroundColor: 'var(--green)' }} />

            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] mb-5" style={{ color: 'var(--green)' }}>
              <span className="block w-8 h-px" style={{ backgroundColor: 'var(--green)', opacity: 0.5 }} />
              PDPA Compliance Platform
            </p>

            <h1
              className="font-black leading-[1.0] tracking-tight mb-6 text-white"
              style={{ fontSize: 'clamp(2.8rem, 5vw, 4.8rem)' }}
            >
              สร้าง<br />
              <span style={{ color: 'var(--green)' }}>Privacy</span><br />
              <span style={{ color: 'var(--green)' }}>Policy</span><br />
              ที่ถูกกฎหมาย
            </h1>

            <p
              className="text-base mb-8 max-w-sm leading-relaxed pl-4"
              style={{ color: '#94a3b8', borderLeft: '2px solid rgba(255,255,255,0.1)' }}
            >
              FlowPDPA ช่วยธุรกิจไทยสร้างนโยบายคุ้มครองข้อมูล
              ที่พร้อมใช้งานจริง ในไม่กี่นาที โดยไม่ต้องพึ่งนักกฎหมาย
            </p>

            <div className="flex flex-wrap gap-3 mb-12">
              <Link to="/create/policy" className="btn-green px-8 py-3.5 text-sm">
                สร้าง Policy เลย
              </Link>
              <a href="#check-website" className="btn-outline-white px-8 py-3.5 text-sm">
                ตรวจสอบฟรี
              </a>
            </div>

            <div className="grid grid-cols-3 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { v: '3,500+', l: 'Policies' },
                { v: 'ISO 29110', l: 'Certified' },
                { v: 'Thai + EN', l: 'Bilingual' },
              ].map(({ v, l }, i) => (
                <div
                  key={l}
                  className="pr-6"
                  style={i > 0 ? { paddingLeft: '24px', borderLeft: '1px solid rgba(255,255,255,0.08)' } : {}}
                >
                  <div className="text-lg font-black text-white mb-0.5">{v}</div>
                  <div className="text-xs tracking-wide" style={{ color: '#64748b' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dark dashboard mockup */}
          <div className="lg:col-span-6 hidden lg:block">
            <div
              className="overflow-hidden"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                backgroundColor: 'var(--navy-light)',
              }}
            >
              {/* Browser chrome */}
              <div
                className="px-4 py-2.5 flex items-center gap-2"
                style={{ backgroundColor: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <div
                  className="flex-1 mx-3 rounded text-xs px-3 py-1 text-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#475569' }}
                >
                  flowpdpa.th/dashboard
                </div>
              </div>

              {/* App content */}
              <div className="p-5">
                {/* Top bar */}
                <div
                  className="flex items-center justify-between mb-5 pb-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div>
                    <div className="text-sm font-bold text-white">My Policies</div>
                    <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>3 documents active</div>
                  </div>
                  <button
                    className="text-xs font-semibold text-white px-3 py-1.5"
                    style={{ backgroundColor: 'var(--green)', borderRadius: '5px' }}
                  >
                    + New Policy
                  </button>
                </div>

                {/* Policy rows */}
                {[
                  { name: 'Privacy Policy', lang: 'TH + EN', status: 'Active', dot: 'var(--green)' },
                  { name: 'Cookies Policy', lang: 'TH + EN', status: 'Active', dot: 'var(--green)' },
                  { name: 'HR Privacy Policy', lang: 'TH + EN', status: 'Draft', dot: '#334155' },
                ].map(({ name, lang, status, dot }) => (
                  <div
                    key={name}
                    className="flex items-center justify-between py-2.5 last:border-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                      <div>
                        <div className="text-sm font-medium text-white">{name}</div>
                        <div className="text-xs" style={{ color: '#64748b' }}>{lang}</div>
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5"
                      style={{
                        borderRadius: '4px',
                        backgroundColor: status === 'Active' ? 'rgba(5,150,105,0.2)' : 'rgba(255,255,255,0.06)',
                        color: status === 'Active' ? '#34d399' : '#475569',
                      }}
                    >
                      {status}
                    </span>
                  </div>
                ))}

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-3" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs mb-1" style={{ color: '#64748b' }}>PDPA Status</div>
                    <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--green)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Compliant
                    </div>
                  </div>
                  <div className="rounded-lg p-3" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs mb-1" style={{ color: '#64748b' }}>Last Updated</div>
                    <div className="text-sm font-bold text-white">May 2025</div>
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
