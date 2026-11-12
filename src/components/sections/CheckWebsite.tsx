import { useState } from 'react'
import { Globe, ShieldCheck, FileSearch } from 'lucide-react'

const benefits = [
  { Icon: FileSearch, text: 'ตรวจสอบ Privacy Policy ปัจจุบัน' },
  { Icon: ShieldCheck, text: 'วิเคราะห์ช่องโหว่ที่ต้องแก้ไข' },
  { Icon: Globe, text: 'แนะนำแนวทางปรับปรุงที่ชัดเจน' },
]

export default function CheckWebsite() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <section id="check-website" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--green)' }}>
              Free PDPA Audit
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 leading-snug">
              ให้เราตรวจสอบเว็บไซต์ของคุณ<br />ว่าสอดคล้องกับ PDPA ฟรี
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              กรอกข้อมูลเว็บไซต์และช่องทางติดต่อ ทีมผู้เชี่ยวชาญของเราจะวิเคราะห์และส่งรายงานให้คุณภายใน 3 วันทำการ
            </p>
            <div className="space-y-3">
              {benefits.map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--green-light)', borderRadius: '8px' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: 'var(--green-dark)' }} />
                  </div>
                  <span className="text-sm text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
            {submitted ? (
              <div className="text-center py-8">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--green-light)' }}
                >
                  <ShieldCheck className="w-6 h-6" style={{ color: 'var(--green)' }} />
                </div>
                <p className="text-gray-900 text-lg font-bold mb-1">ส่งคำขอสำเร็จ!</p>
                <p className="text-gray-400 text-sm">เราจะส่งผลการตรวจสอบภายใน 3 วันทำการ</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    URL เว็บไซต์ <span className="text-red-400 normal-case">*</span>
                  </label>
                  <input type="url" required placeholder="https://www.yourwebsite.com"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      อีเมล <span className="text-red-400 normal-case">*</span>
                    </label>
                    <input type="email" required placeholder="email@company.com"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      เบอร์โทรศัพท์ <span className="text-red-400 normal-case">*</span>
                    </label>
                    <input type="tel" required placeholder="0812345678"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
                  </div>
                </div>
                <div className="flex items-start gap-2.5 pt-1">
                  <input type="checkbox" required id="check-terms" className="mt-1" />
                  <label htmlFor="check-terms" className="text-xs text-gray-400 leading-relaxed">
                    ฉันยอมรับ{' '}
                    <a href="/terms" style={{ color: 'var(--green)' }} className="underline">เงื่อนไขการใช้บริการ</a>
                    {' '}และ{' '}
                    <a href="/privacy-policy" style={{ color: 'var(--green)' }} className="underline">นโยบายความเป็นส่วนตัว</a>
                  </label>
                </div>
                <button type="submit" className="btn-green w-full py-3.5 text-sm font-bold" style={{ borderRadius: '8px' }}>
                  ส่งคำขอตรวจสอบ
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
