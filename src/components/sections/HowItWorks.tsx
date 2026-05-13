import FadeUp from '@/components/ui/FadeUp'
import { useInView } from '@/hooks/useInView'

const steps = [
  {
    num: '01',
    title: 'เลือกประเภทนโยบาย',
    desc: 'เลือกนโยบายที่ตรงกับธุรกิจของคุณ ไม่ว่าจะเป็น Privacy Policy, Cookies Policy หรือนโยบายอื่นๆ ที่ต้องการ',
    badge: '~1 นาที',
  },
  {
    num: '02',
    title: 'กรอกข้อมูลธุรกิจ',
    desc: 'ตอบคำถามง่ายๆ เกี่ยวกับธุรกิจของคุณ ระบบจะสร้างนโยบายที่เหมาะสมให้โดยอัตโนมัติ ไม่ต้องมีความรู้กฎหมาย',
    badge: '~3 นาที',
  },
  {
    num: '03',
    title: 'รับและนำไปใช้ได้เลย',
    desc: 'ดาวน์โหลดไฟล์ PDF / Word หรือคัดลอก HTML Code ไปวางบนเว็บไซต์ นโยบายของคุณพร้อมใช้งานทันที',
    badge: 'พร้อมใช้งาน',
  },
]

export default function HowItWorks() {
  const { ref, inView } = useInView()

  return (
    <section id="how-it-works" className="py-24" style={{ backgroundColor: 'var(--navy)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <FadeUp className="mb-16">
          <p
            className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] mb-4"
            style={{ color: 'var(--green)' }}
          >
            <span className="block w-8 h-px" style={{ backgroundColor: 'var(--green)', opacity: 0.5 }} />
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            เริ่มต้นง่าย เพียง 3 ขั้นตอน
          </h2>
          <p className="text-base" style={{ color: '#64748b' }}>
            ไม่ต้องเตรียมเอกสาร ไม่ต้องมีความรู้ด้านกฎหมาย
          </p>
        </FadeUp>

        {/* Steps — horizontal on desktop, vertical on mobile */}
        <div
          ref={ref}
          className={`grid grid-cols-1 md:grid-cols-3 gap-4 stagger-grid ${inView ? 'in-view' : ''}`}
        >
          {steps.map(({ num, title, desc, badge }, i) => (
            <div
              key={num}
              className="relative rounded-2xl p-8 flex flex-col"
              style={{
                backgroundColor: 'var(--navy-light)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Step number — big, faded, top-right */}
              <span
                className="absolute top-6 right-7 text-5xl font-black leading-none select-none"
                style={{ color: 'rgba(5,150,105,0.12)' }}
              >
                {num}
              </span>

              {/* Badge */}
              <span
                className="self-start text-xs font-bold px-3 py-1 rounded-full mb-6"
                style={{ backgroundColor: 'rgba(5,150,105,0.15)', color: 'var(--green)' }}
              >
                {badge}
              </span>

              {/* Circle index */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black mb-5 shrink-0"
                style={{ backgroundColor: 'var(--green)' }}
              >
                {i + 1}
              </div>

              <h3 className="text-lg font-black text-white mb-3 leading-snug">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>

              {/* Connector arrow — hidden on last card and mobile */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-lg font-black"
                  style={{ color: 'rgba(5,150,105,0.4)' }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        <FadeUp delay={400}>
          <div className="mt-12 pt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm" style={{ color: '#475569' }}>
              เฉลี่ยใช้เวลาน้อยกว่า <span className="text-white font-bold">5 นาที</span> ในการสร้างนโยบาย
            </p>
            <a href="/create/policy" className="btn-green px-10 py-3 text-base shrink-0">
              เริ่มสร้าง Policy เลย
            </a>
          </div>
        </FadeUp>

      </div>
    </section>
  )
}
