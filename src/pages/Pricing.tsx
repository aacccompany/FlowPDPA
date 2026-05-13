import { Check, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import FadeUp from '@/components/ui/FadeUp'
import { useInView } from '@/hooks/useInView'

const tiers = [
  {
    name: 'Free',
    price: 'ฟรี',
    sub: 'ไม่มีค่าใช้จ่าย',
    cta: 'เริ่มใช้งานฟรี',
    href: '/create/policy',
    highlight: false,
    features: [
      { text: 'Privacy Policy ภาษาไทย', yes: true },
      { text: 'รองรับ 1 เว็บไซต์', yes: true },
      { text: 'คุ้มครองตาม PDPA ไทย', yes: true },
      { text: 'ลิงก์สาธารณะแชร์ได้', yes: true },
      { text: 'ภาษาอังกฤษ (Bilingual)', yes: false },
      { text: 'คุ้มครองตาม GDPR & CCPA', yes: false },
      { text: 'ดาวน์โหลด PDF / Word / TXT', yes: false },
      { text: 'HTML Code สำหรับฝังเว็บ', yes: false },
      { text: 'อัปเดตตามกฎหมายตลอดชีพ', yes: false },
      { text: 'ครอบคลุมข้อมูลอ่อนไหว', yes: false },
    ],
  },
  {
    name: 'Premium',
    price: '2,500',
    sub: 'บาท (รวม VAT) ชำระครั้งเดียว',
    cta: 'สร้าง Policy Premium',
    href: '/create/policy',
    highlight: true,
    features: [
      { text: 'Privacy Policy ภาษาไทย', yes: true },
      { text: 'รองรับ 1 เว็บไซต์', yes: true },
      { text: 'คุ้มครองตาม PDPA ไทย', yes: true },
      { text: 'ลิงก์สาธารณะแชร์ได้', yes: true },
      { text: 'ภาษาอังกฤษ (Bilingual)', yes: true },
      { text: 'คุ้มครองตาม GDPR & CCPA', yes: true },
      { text: 'ดาวน์โหลด PDF / Word / TXT', yes: true },
      { text: 'HTML Code สำหรับฝังเว็บ', yes: true },
      { text: 'อัปเดตตามกฎหมายตลอดชีพ', yes: true },
      { text: 'ครอบคลุมข้อมูลอ่อนไหว', yes: true },
    ],
  },
  {
    name: 'Enterprise',
    price: 'ติดต่อเรา',
    sub: 'ราคาพิเศษสำหรับองค์กร',
    cta: 'ติดต่อทีมงาน',
    href: '/#contact',
    highlight: false,
    features: [
      { text: 'ทุกอย่างใน Premium', yes: true },
      { text: 'หลายเว็บไซต์ / หลายนโยบาย', yes: true },
      { text: 'Data Processing Agreement (DPA)', yes: true },
      { text: 'ที่ปรึกษา PDPA ส่วนตัว', yes: true },
      { text: 'SLA และ Priority Support', yes: true },
      { text: 'Custom legal clauses', yes: true },
      { text: 'รายงานการตรวจสอบประจำปี', yes: true },
      { text: 'ฝึกอบรมทีมงาน (Online)', yes: true },
      { text: 'White-label / API Access', yes: true },
      { text: 'Invoice & ใบกำกับภาษี', yes: true },
    ],
  },
]

export default function Pricing() {
  const { ref, inView } = useInView()
  return (
    <div style={{ paddingTop: '61px' }}>
      {/* Header */}
      <div className="py-16 border-b border-gray-100" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">
            <span className="block w-8 h-px bg-gray-300" />
            Pricing
            <span className="block w-8 h-px bg-gray-300" />
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            ราคาที่ชัดเจน ไม่มีค่าใช้จ่ายซ่อนเร้น
          </h1>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            เริ่มต้นฟรี อัปเกรดเมื่อธุรกิจของคุณพร้อม ทุกแผนรวม Privacy Policy ทั้งภาษาไทยหรืออังกฤษ
          </p>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={ref}
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 stagger-grid ${inView ? 'in-view' : ''}`}
          >
            {tiers.map(({ name, price, sub, cta, href, highlight, features }) => (
              <div
                key={name}
                className="rounded-2xl border overflow-hidden flex flex-col"
                style={{
                  borderColor: highlight ? 'var(--green)' : '#e5e7eb',
                  boxShadow: highlight ? '0 0 0 2px var(--green)' : 'none',
                }}
              >
                {highlight && (
                  <div className="text-center text-xs font-bold text-white py-1.5 tracking-wider uppercase" style={{ backgroundColor: 'var(--green)' }}>
                    Most Popular
                  </div>
                )}
                <div className="p-7 flex flex-col flex-1">
                  <div className="mb-6">
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{name}</div>
                    <div className="flex items-baseline gap-1 mb-1">
                      {name !== 'Enterprise' && <span className="text-4xl font-black text-gray-900">{price}</span>}
                      {name === 'Enterprise' && <span className="text-2xl font-black text-gray-900">{price}</span>}
                      {name === 'Premium' && <span className="text-sm text-gray-400 ml-1">บาท</span>}
                    </div>
                    <div className="text-xs text-gray-400">{sub}</div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {features.map(({ text, yes }) => (
                      <li key={text} className="flex items-start gap-3">
                        {yes
                          ? <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--green)' }} />
                          : <Minus className="w-4 h-4 shrink-0 mt-0.5 text-gray-300" />
                        }
                        <span className={`text-sm ${yes ? 'text-gray-700' : 'text-gray-300'}`}>{text}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={href}
                    className="block text-center py-3 text-sm font-bold rounded-lg transition-opacity hover:opacity-90"
                    style={
                      highlight
                        ? { backgroundColor: 'var(--green)', color: 'white' }
                        : { backgroundColor: '#f3f4f6', color: '#374151' }
                    }
                  >
                    {cta}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <FadeUp delay={300}>
            <p className="text-center text-xs text-gray-400 mt-8">
              ต้องการนโยบายประเภทอื่น เช่น HR Policy, Cookies Policy?{' '}
              <Link to="/#services" className="underline font-medium" style={{ color: 'var(--green)' }}>
                ดูบริการทั้งหมด
              </Link>
            </p>
          </FadeUp>
        </div>
      </div>
    </div>
  )
}
