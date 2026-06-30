import { useState } from 'react'
import { Mail, Phone, Clock, MapPin, MessageCircle, FileText, HelpCircle, LifeBuoy, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import FadeUp from '@/components/ui/FadeUp'

const channels = [
  {
    Icon: Mail,
    title: 'อีเมล',
    value: 'contact@flowpdpa.co.th',
    desc: 'ตอบกลับภายใน 1 วันทำการ',
    href: 'mailto:contact@flowpdpa.co.th',
  },
  {
    Icon: Phone,
    title: 'โทรศัพท์',
    value: '043-123-456',
    desc: 'จันทร์ – ศุกร์  09:00 – 18:00 น.',
    href: 'tel:043123456',
  },
  {
    Icon: MessageCircle,
    title: 'Live Chat',
    value: 'ส่งข้อความหาเรา',
    desc: 'กรอกแบบฟอร์มด้านล่าง ตอบกลับภายใน 1 วัน',
    href: '#support-contact-form',
  },
]

const quickLinks = [
  { Icon: FileText, label: 'ดูคำถามที่พบบ่อย', to: '/faq' },
  { Icon: HelpCircle, label: 'วิธีนำ Policy ไปใช้บนเว็บไซต์', to: '/faq' },
  { Icon: FileText, label: 'สร้าง Policy ของคุณ', to: '/get-started' },
  { Icon: HelpCircle, label: 'ส่งคำขอรับการสนับสนุน (Helpdesk)', to: '/helpdesk' },
]

const inputCls = 'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-500 transition-colors bg-white'
const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5'

export default function Support() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <div style={{ paddingTop: '68px', backgroundColor: '#ffffff' }}>

      {/* Page header */}
      <div style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--green)' }}>
            Support
          </p>
          <h1 className="font-black mb-5 text-white" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}>
            เราพร้อมช่วยเหลือคุณ
          </h1>
          <p className="text-base leading-relaxed" style={{ color: '#64748b', maxWidth: '520px' }}>
            มีคำถามหรือต้องการคำแนะนำเรื่อง PDPA? ทีมงานของเราพร้อมตอบทุกคำถาม
            และจะติดต่อกลับภายใน 1 วันทำการเสมอ
          </p>
        </div>
      </div>

      {/* Contact channels */}
      <div className="py-14" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {channels.map(({ Icon, title, value, desc, href }) => (
              <FadeUp key={title}>
                <a
                  href={href}
                  className="block p-7 h-full transition-all"
                  style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#c8ded6' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                >
                  <div className="w-11 h-11 flex items-center justify-center mb-5"
                    style={{ backgroundColor: '#f0faf5', borderRadius: '10px' }}>
                    <Icon className="w-5 h-5" style={{ color: 'var(--green)' }} />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>{title}</div>
                  <div className="font-bold text-sm mb-1" style={{ color: '#111827' }}>{value}</div>
                  <div className="text-xs" style={{ color: '#9ca3af' }}>{desc}</div>
                </a>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>

      {/* Helpdesk CTA */}
      <div className="py-10" style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 px-8 py-7"
              style={{ backgroundColor: '#f0faf5', border: '1px solid #c8ded6', borderRadius: '12px' }}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #c8ded6' }}>
                  <LifeBuoy className="w-5 h-5" style={{ color: 'var(--green)' }} />
                </div>
                <div>
                  <p className="font-bold text-base mb-1" style={{ color: '#111827' }}>พบปัญหาหรือต้องการแจ้งเรื่องราว?</p>
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    ส่ง Ticket ผ่านระบบ Helpdesk ของเรา ทีมงานจะติดต่อกลับภายใน 1 วันทำการ
                  </p>
                </div>
              </div>
              <Link to="/helpdesk" className="btn-green shrink-0 flex items-center gap-2 text-sm">
                ส่งคำขอ Helpdesk
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </div>

      {/* Form + info */}
      <div id="support-contact-form" style={{ backgroundColor: '#ffffff' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: '600px' }}>

          {/* Left — info */}
          <div className="py-16 px-8 lg:px-14" style={{ backgroundColor: 'var(--navy)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--green)' }}>
              Contact Info
            </p>
            <h2 className="text-2xl font-bold mb-3 text-white">ข้อมูลติดต่อ</h2>
            <p className="text-sm mb-10 leading-relaxed" style={{ color: '#64748b' }}>
              ส่งแบบฟอร์มด้านขวา หรือติดต่อเราโดยตรงผ่านช่องทางด้านล่าง
            </p>

            <div className="space-y-6 mb-12">
              {[
                { Icon: MapPin, label: 'ที่อยู่', value: '99/9 อาคารขอนแก่น บิซิเนส เซ็นเตอร์ ชั้น 5\nถนนศรีจันทร์ ตำบลในเมือง อำเภอเมืองขอนแก่น\nจังหวัดขอนแก่น 40000' },
                { Icon: Phone, label: 'โทรศัพท์', value: '043-123-456' },
                { Icon: Mail, label: 'อีเมล', value: 'contact@flowpdpa.co.th' },
                { Icon: Clock, label: 'เวลาทำการ', value: 'จันทร์ – ศุกร์  09:00 – 18:00 น.' },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-9 h-9 flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: 'rgba(5,150,105,0.15)', borderRadius: '8px' }}>
                    <Icon className="w-4 h-4" style={{ color: 'var(--green)' }} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#334155' }}>{label}</div>
                    <div className="text-sm leading-relaxed whitespace-pre-line text-white">{value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '24px' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#334155' }}>ลิงก์ที่มีประโยชน์</div>
              <div className="space-y-2">
                {quickLinks.map(({ Icon, label, to }) => (
                  <Link key={label} to={to}
                    className="flex items-center gap-3 text-sm transition-colors py-1"
                    style={{ color: '#475569' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="py-16 px-8 lg:px-14" style={{ backgroundColor: '#ffffff' }}>
            {submitted ? (
              <div className="flex items-center justify-center h-full min-h-80">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ backgroundColor: '#f0faf5' }}>
                    <Mail className="w-7 h-7" style={{ color: 'var(--green)' }} />
                  </div>
                  <p className="text-xl font-bold mb-2" style={{ color: '#111827' }}>ส่งข้อความสำเร็จ!</p>
                  <p className="text-sm" style={{ color: '#9ca3af' }}>เราจะติดต่อกลับภายใน 1 วันทำการ</p>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>ส่งข้อความหาเรา</h3>
                <p className="text-sm mb-8" style={{ color: '#9ca3af' }}>กรอกข้อมูลด้านล่าง ทีมงานจะติดต่อกลับโดยเร็วที่สุด</p>
                <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>ชื่อ <span className="text-red-400 normal-case">*</span></label>
                      <input type="text" required placeholder="ชื่อของคุณ" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>นามสกุล</label>
                      <input type="text" placeholder="นามสกุล" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>ชื่อบริษัท</label>
                      <input type="text" placeholder="บริษัท..." className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>เบอร์โทรศัพท์</label>
                      <input type="tel" placeholder="0812345678" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>อีเมล <span className="text-red-400 normal-case">*</span></label>
                    <input type="email" required placeholder="email@company.com" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>หัวข้อที่ต้องการสอบถาม</label>
                    <select className={inputCls}>
                      <option value="">เลือกหัวข้อ...</option>
                      <option>สอบถามเรื่องราคาและแผนบริการ</option>
                      <option>ปัญหาทางเทคนิค</option>
                      <option>ขอคำปรึกษาด้าน PDPA</option>
                      <option>สอบถามแผน Enterprise</option>
                      <option>อื่นๆ</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>รายละเอียด</label>
                    <textarea rows={4} placeholder="อธิบายสิ่งที่ต้องการสอบถาม..."
                      className={inputCls + ' resize-none'} />
                  </div>
                  <div className="flex items-start gap-2.5 pt-1">
                    <input type="checkbox" required id="support-consent" className="mt-1" />
                    <label htmlFor="support-consent" className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
                      ฉันยอมรับ{' '}
                      <Link to="/terms" style={{ color: 'var(--green)' }} className="underline">เงื่อนไขการใช้บริการ</Link>
                      {' '}และ{' '}
                      <Link to="/privacy-policy" style={{ color: 'var(--green)' }} className="underline">นโยบายความเป็นส่วนตัว</Link>
                      {' '}ของ FlowPDPA
                    </label>
                  </div>
                  <button type="submit" className="btn-green w-full py-3.5 text-sm font-bold" style={{ borderRadius: '8px' }}>
                    ส่งข้อความ
                  </button>
                </form>
              </>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}
