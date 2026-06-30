import { useState } from 'react'
import { CheckCircle, MapPin, Phone, Mail, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const contactInfo = [
  { Icon: MapPin,  label: 'ที่อยู่',    value: '99/9 อาคารขอนแก่น บิซิเนส เซ็นเตอร์ ชั้น 5\nถนนศรีจันทร์ ตำบลในเมือง อำเภอเมืองขอนแก่น\nจังหวัดขอนแก่น 40000' },
  { Icon: Phone,   label: 'โทรศัพท์',   value: '043-123-456' },
  { Icon: Mail,    label: 'อีเมล',       value: 'contact@flowpdpa.co.th' },
  { Icon: Clock,   label: 'เวลาทำการ',  value: 'จันทร์ – ศุกร์  09:00 – 18:00 น.' },
]

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <section id="contact">
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: '600px' }}>

        {/* Left — info */}
        <div className="py-16 px-8 lg:px-14" style={{ backgroundColor: 'var(--navy)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--green)' }}>
            Contact Us
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">
            ติดต่อทีมงาน FlowPDPA
          </h2>
          <p className="text-sm mb-10 leading-relaxed" style={{ color: '#64748b' }}>
            มีคำถามหรือต้องการคำแนะนำ? ทีมงานของเราพร้อมช่วยเหลือและจะติดต่อกลับภายใน 1 วันทำการ
          </p>

          <div className="space-y-7">
            {contactInfo.map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-9 h-9 flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: 'rgba(5,150,105,0.15)', borderRadius: '6px' }}>
                  <Icon className="w-4 h-4" style={{ color: 'var(--green)' }} />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#334155' }}>{label}</div>
                  <div className="text-sm leading-relaxed whitespace-pre-line text-white">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="py-16 px-8 lg:px-14 bg-white">
          {submitted ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--green-light)' }}
                >
                  <CheckCircle className="w-6 h-6" style={{ color: 'var(--green)' }} aria-hidden="true" />
                </div>
                <p className="text-gray-900 text-xl font-bold mb-2">ส่งข้อความสำเร็จ!</p>
                <p className="text-gray-400 text-sm">เราจะติดต่อกลับภายใน 1 วันทำการ</p>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-gray-900 mb-6">ส่งข้อความหาเรา</h3>
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">ชื่อ</label>
                    <input type="text" required placeholder="ชื่อของคุณ"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">นามสกุล</label>
                    <input type="text" placeholder="นามสกุล"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">ชื่อบริษัท</label>
                    <input type="text" placeholder="บริษัท..."
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">เบอร์โทรศัพท์</label>
                    <input type="tel" placeholder="0812345678"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    อีเมล <span className="text-red-400 normal-case">*</span>
                  </label>
                  <input type="email" required placeholder="email@company.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
                </div>
                <div className="flex items-start gap-2.5 pt-1">
                  <input type="checkbox" required id="consent" className="mt-1" />
                  <label htmlFor="consent" className="text-xs text-gray-400 leading-relaxed">
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
    </section>
  )
}
