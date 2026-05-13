const services = [
  { name: 'FlowConsent', desc: 'ระบบจัดการความยินยอมของลูกค้าแบบครบวงจร', color: 'var(--navy)', light: '#f0f4ff' },
  { name: 'FlowCookie', desc: 'สร้างแบนเนอร์แจ้งคุกกี้ที่ถูกต้องตามกฎหมาย', color: 'var(--blue)', light: '#eff6ff' },
  { name: 'FlowForm', desc: 'แบบฟอร์มออนไลน์ที่รวบรวมข้อมูลได้อย่างถูกต้อง', color: 'var(--blue-dark)', light: '#f0f4ff' },
  { name: 'LearnPDPA', desc: 'คอร์สอบรม PDPA สำหรับทีมงานในองค์กรของคุณ', color: 'var(--green)', light: 'var(--green-light)' },
]

export default function OtherServices() {
  return (
    <section id="other-services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--green)' }}>
              Our Ecosystem
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              บริการอื่นๆ จาก FlowPDPA
            </h2>
          </div>
          <a href="#" className="text-sm font-semibold" style={{ color: 'var(--blue)' }}>
            ดูบริการทั้งหมด →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {services.map(({ name, desc, color, light }) => (
            <a
              key={name}
              href="#"
              className="rounded-xl p-6 block border border-gray-200 hover:shadow-md transition-shadow bg-white group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: light }}
              >
                <span className="text-lg font-black" style={{ color }}>F</span>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1.5 group-hover:underline" style={{ color }}>
                {name}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </a>
          ))}
        </div>

        <div
          className="rounded-xl p-7 flex flex-col sm:flex-row items-center justify-between gap-6 border"
          style={{ backgroundColor: '#eff6ff', borderColor: 'var(--blue-light)' }}
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--blue)' }}>
              Bundle Deal
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-1">
              <span style={{ color: 'var(--blue)' }}>FlowPDPA Kit</span> — ชุดเอกสาร PDPA ครบจบสำหรับองค์กร
            </h3>
            <p className="text-gray-500 text-sm">
              ราคาพิเศษ <span className="font-bold text-lg" style={{ color: 'var(--green)' }}>ติดต่อสอบถาม</span>
            </p>
          </div>
          <a href="#contact" className="btn-green px-8 py-3 shrink-0 whitespace-nowrap">
            สอบถามรายละเอียด
          </a>
        </div>
      </div>
    </section>
  )
}
