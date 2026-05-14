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
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">
              <span className="block w-8 h-px bg-gray-300" />
              Customer Stories
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              ลูกค้าของเราพูดถึง FlowPDPA
            </h2>
          </div>

          {/* ISO Badges */}
          <div className="flex items-center gap-3 shrink-0">
            {[
              { code: '27001', label: 'Information Security', color: 'var(--blue)' },
              { code: '27701', label: 'Privacy Management', color: 'var(--green)' },
            ].map(({ code, label, color }) => (
              <div
                key={code}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg"
                style={{ borderColor: color + '33', backgroundColor: color + '08' }}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color }} />
                <div>
                  <div className="text-xs font-black leading-tight" style={{ color }}>ISO {code}</div>
                  <div className="text-xs text-gray-400 leading-tight">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quotes.map(({ name, role, initials, text }) => (
            <div
              key={name}
              className="flex flex-col justify-between p-8 rounded-2xl border border-gray-100"
              style={{ backgroundColor: '#fafafa' }}
            >
              {/* Large quote mark */}
              <div
                className="text-6xl font-serif leading-none mb-4 select-none"
                style={{ color: 'var(--green)', opacity: 0.25, fontFamily: 'Georgia, serif' }}
              >
                "
              </div>
              <p className="text-gray-700 text-base leading-relaxed flex-1 mb-6">
                {text}
              </p>
              <div className="flex items-center gap-3 pt-5 border-t border-gray-200">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: 'var(--blue)' }}
                >
                  {initials}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{name}</div>
                  <div className="text-xs text-gray-400">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
