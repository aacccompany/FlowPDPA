import { ShieldCheck } from 'lucide-react'

const quotes = [
  {
    name: 'James Hartwell',
    role: 'Founder, Digital Flame Co., Ltd.',
    initials: 'JH',
    text: 'ก่อนใช้ FlowPDPA เราต้องรอนักกฎหมายนานหลายสัปดาห์ ตอนนี้สร้าง Privacy Policy ได้เองในไม่กี่นาที ได้ทั้งภาษาไทยและอังกฤษ และมั่นใจว่าถูกต้องตาม PDPA',
  },
  {
    name: 'Sophia Langford',
    role: 'COO, TechFlow Co., Ltd.',
    initials: 'SL',
    text: 'Dashboard ใช้งานง่ายมาก จัดการนโยบายทุกเว็บไซต์ในบัญชีเดียว ทีมงานดูแลดีทุกครั้งที่ติดต่อ แนะนำให้ทุกธุรกิจที่ต้องการความสบายใจด้าน PDPA ลองใช้เลย',
  },
]

export default function Testimonial() {
  return (
    <section className="py-20" style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--green)' }}>
              Customer Stories
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: '#111827' }}>
              ลูกค้าของเราพูดถึง FlowPDPA
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {[
              { code: '27001', label: 'Information Security', color: 'var(--green)' },
              { code: '27701', label: 'Privacy Management', color: 'var(--green)' },
            ].map(({ code, label, color }) => (
              <div key={code} className="flex items-center gap-2 px-3 py-2"
                style={{ border: '1px solid #c8ded6', backgroundColor: '#f0faf5', borderRadius: '6px' }}>
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color }} />
                <div>
                  <div className="text-xs font-black leading-tight" style={{ color }}>ISO {code}</div>
                  <div className="text-xs leading-tight" style={{ color: '#9ca3af' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quotes.map(({ name, role, initials, text }) => (
            <div key={name} className="flex flex-col justify-between p-8"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="text-5xl font-serif leading-none mb-4 select-none"
                style={{ color: 'var(--green)', opacity: 0.2, fontFamily: 'Georgia, serif' }}>
                "
              </div>
              <p className="text-base leading-relaxed flex-1 mb-6" style={{ color: '#374151' }}>
                {text}
              </p>
              <div className="flex items-center gap-3 pt-5" style={{ borderTop: '1px solid #f3f4f6' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: 'var(--green)' }}>
                  {initials}
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#111827' }}>{name}</div>
                  <div className="text-xs" style={{ color: '#9ca3af' }}>{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
