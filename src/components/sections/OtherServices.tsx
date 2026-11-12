import { Bell, MessageCircle, Search, ShieldCheck } from 'lucide-react'

const services = [
  {
    name: 'FlowScan',
    tag: 'Risk Checker',
    desc: 'วางลิงก์เว็บไซต์ของคุณ — ระบบสแกนหาจุดเสี่ยง PDPA และรายงานผลใน 60 วินาที',
    color: 'var(--navy)',
    light: '#f0f4ff',
    Icon: Search,
  },
  {
    name: 'FlowLine',
    tag: 'LINE Native',
    desc: 'รับความยินยอมและส่ง Privacy Notice ผ่าน LINE OA ของคุณ เหมาะสำหรับธุรกิจไทยที่ใช้ LINE เป็นช่องทางหลัก',
    color: '#06b640',
    light: '#f0fdf4',
    Icon: MessageCircle,
  },
  {
    name: 'FlowBadge',
    tag: 'Trust Signal',
    desc: 'ตราสัญลักษณ์ PDPA Compliant สำหรับติดบนเว็บไซต์ของคุณ เพิ่มความน่าเชื่อถือให้ลูกค้าเห็นได้ทันที',
    color: 'var(--blue-mid)',
    light: '#eff6ff',
    Icon: ShieldCheck,
  },
  {
    name: 'FlowAlert',
    tag: 'Law Monitor',
    desc: 'รับแจ้งเตือนทันทีเมื่อกฎหมาย PDPA มีการเปลี่ยนแปลง พร้อมคำแนะนำว่านโยบายของคุณต้องอัปเดตอะไรบ้าง',
    color: '#d97706',
    light: '#fffbeb',
    Icon: Bell,
  },
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
          {services.map(({ name, tag, desc, color, light, Icon }) => (
            <a
              key={name}
              href="#"
              className="rounded-xl p-6 block border border-gray-200 hover:shadow-md transition-all bg-white group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: light }}
                >
                  <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: light, color }}
                >
                  {tag}
                </span>
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
              <span style={{ color: 'var(--blue)' }}>FlowPDPA Suite</span> — ครบทุกเครื่องมือในแพ็กเกจเดียว
            </h3>
            <p className="text-gray-500 text-sm">
              Policy + FlowScan + FlowBadge + FlowAlert ราคาพิเศษ{' '}
              <span className="font-bold text-lg" style={{ color: 'var(--green)' }}>ติดต่อสอบถาม</span>
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
